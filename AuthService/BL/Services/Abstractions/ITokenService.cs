using Authentication.API.DAL.Entities;
using System.Security.Claims;

namespace Authentication.API.BL.Services.Abstractions;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string MaskToken(string token);
    ClaimsPrincipal? ValidateToken(string token);
}