using AuthService.BL.Models;
using AuthService.BL.Services.Abstractions;
using AuthService.DAL;
using AuthService.DAL.Entities;
using AuthService.Infrastructure.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using static BCrypt.Net.BCrypt;

namespace AuthService.BL.Services;

public class AuthenticationService : IAuthService
{
    private readonly AuthDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<AuthenticationService> _logger;

    public AuthenticationService(AuthDbContext dbContext, ITokenService tokenService, IOptions<JwtOptions> jwtOptions, ILogger<AuthenticationService> logger)
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

    public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            return null;
        }

        var user = await _dbContext.Users.FindAsync(storedToken.UserId);
        if (user == null || !user.IsActive)
        {
            return null;
        }

        storedToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user);
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        var storedToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        var maskedToken = string.Concat(refreshToken.AsSpan(0, Math.Min(8, refreshToken.Length)), "...");
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
