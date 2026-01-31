using AuthService.BL.Models;
using AuthService.BL.Services.Abstractions;
using AuthService.DAL;
using AuthService.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using static BCrypt.Net.BCrypt;

namespace AuthService.BL.Services;

public class AuthService
{
    private readonly AuthDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AuthDbContext dbContext, ITokenService tokenService, ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request) { 
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
