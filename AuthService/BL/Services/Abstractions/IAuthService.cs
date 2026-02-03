using Authentication.API.BL.Models;

namespace Authentication.API.BL.Services.Abstractions;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task RevokeTokenAsync(string refreshToken);
}