using AuthService.BL.Models;
using AuthService.BL.Services.Abstractions;
using AuthService.DAL;
using AuthService.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using static BCrypt.Net.BCrypt;

namespace AuthService.BL.Services;

public class AuthenticationService : IAuthService
{
    private readonly AuthDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthenticationService> _logger;

    public AuthenticationService(AuthDbContext dbContext, ITokenService tokenService, ILogger<AuthenticationService> logger)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
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
        return await GetAuthResponseAsync(user);
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
        return await GetAuthResponseAsync(user);
    }

    private async Task<AuthResponse> GetAuthResponseAsync(User user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);

        return new AuthResponse
        {
            Token = accessToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
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
