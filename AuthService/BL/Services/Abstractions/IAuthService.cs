using AuthService.BL.Models;

namespace AuthService.BL.Services.Abstractions;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
}