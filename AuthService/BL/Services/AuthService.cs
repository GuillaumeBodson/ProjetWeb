using Authentication.API.BL.Models;
using Authentication.API.BL.Services.Abstractions;
using Authentication.API.DAL;
using Authentication.API.DAL.Entities;
using Authentication.API.Infrastructure.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using static BCrypt.Net.BCrypt;

namespace Authentication.API.BL.Services;

public class AuthService : IAuthService
{
    private readonly AuthDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AuthDbContext dbContext, ITokenService tokenService, IOptions<JwtOptions> jwtOptions, ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
        _jwtOptions = jwtOptions.Value;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _dbContext.Users.AnyAsync(u => u.Email == request.Email))
        {
            _logger.LogWarning("Registration attempt with existing email: {Email}", request.Email);
            throw new InvalidOperationException("User with this email already exists.");
        }
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = "User",
            PasswordHash = HashPassword(request.Password)
        };
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("New user registered: {Email}", user.Email);
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User logged in: {Email}", user.Email);
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        var maskedToken = _tokenService.MaskToken(refreshToken);

        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            _logger.LogWarning("Invalid, revoked, or expired refresh token received for refresh: {Token}", maskedToken);
            
            throw new InvalidOperationException("The provided refresh token is invalid, revoked, or expired.");
        }

        var user = await _dbContext.Users.FindAsync(storedToken.UserId);
        if (user == null || !user.IsActive)
        {
            _logger.LogWarning($"Refresh token refresh failed for non-existent or inactive user. Token: {maskedToken}, UserId: {storedToken.UserId}");
            throw new InvalidOperationException("The user associated with the refresh token does not exist or is inactive.");
        }

        storedToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user);
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        var storedToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        var maskedToken = _tokenService.MaskToken(refreshToken);
        if (storedToken == null || storedToken.IsRevoked)
        {
            _logger.LogWarning("Attempt to revoke invalid or already revoked token: {Token}", maskedToken);
            throw new InvalidOperationException("The provided refresh token is invalid or already revoked.");
        }
        storedToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Refresh token revoked: {Token}", maskedToken);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        _dbContext.RefreshTokens.Add(refreshTokenEntity);
        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            Token = accessToken,
            ExpiresAt = DateTime.UtcNow.AddHours(_jwtOptions.AccessTokenExpirationHours),
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role
            }
        };
    }
}
