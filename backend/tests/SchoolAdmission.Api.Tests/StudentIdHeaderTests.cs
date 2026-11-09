using SchoolAdmission.Api.Configuration;

namespace SchoolAdmission.Api.Tests;

public class StudentIdHeaderTests
{
    [Theory]
    [InlineData("20152691234567890")]
    [InlineData("00000000000000000")]
    [InlineData("99999999999999999")]
    public void Accepts_seventeen_digit_ids(string value)
    {
        Assert.True(StudentIdHeader.IsValid(value));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("2015269123456789")]      // 16 digits
    [InlineData("201526912345678901")]    // 18 digits
    [InlineData("2015269123456789a")]
    [InlineData("2015 2691234567890")]
    [InlineData("201526912345678-0")]
    public void Rejects_malformed_ids(string value)
    {
        Assert.False(StudentIdHeader.IsValid(value));
    }

    [Fact]
    public void Accepts_surrounding_whitespace()
    {
        Assert.True(StudentIdHeader.IsValid("  20152691234567890  "));
    }

    [Fact]
    public void Rejects_null()
    {
        Assert.False(StudentIdHeader.IsValid(null));
    }
}
