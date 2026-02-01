using AuthService.DAL.Entities;
using System.Security.Claims;

namespace AuthService.BL.Services.Abstractions;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    ClaimsPrincipal? ValidateToken(string token);
}