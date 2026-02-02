using AuthService.DAL.Entities;
using System.Security.Claims;

namespace AuthService.BL.Services.Abstractions;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string MaskToken(string token);
    ClaimsPrincipal? ValidateToken(string token);
}