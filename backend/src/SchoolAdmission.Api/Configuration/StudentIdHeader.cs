using System.Text.RegularExpressions;

namespace SchoolAdmission.Api.Configuration;

/// <summary>
/// Resolves and validates the student identity carried in the X-Student-Id header.
/// </summary>
public static partial class StudentIdHeader
{
    public const string HeaderName = "X-Student-Id";

    [GeneratedRegex(@"^\d{17}$")]
    private static partial Regex StudentIdPattern();

    public static bool IsValid(string? value) =>
        !string.IsNullOrWhiteSpace(value) && StudentIdPattern().IsMatch(value.Trim());

    /// <summary>
    /// Returns the trimmed student id, or null when the header is missing or malformed.
    /// </summary>
    public static string? From(HttpRequest request)
    {
        if (!request.Headers.TryGetValue(HeaderName, out var raw))
        {
            return null;
        }

        var value = raw.ToString().Trim();
        return IsValid(value) ? value : null;
    }
}
