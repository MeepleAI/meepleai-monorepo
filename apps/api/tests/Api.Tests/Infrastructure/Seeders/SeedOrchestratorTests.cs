using Api.Infrastructure.Seeders;
using Api.Tests.Constants;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Api.Tests.Infrastructure.Seeders;

[Trait("Category", TestCategories.Unit)]
public sealed class SeedOrchestratorTests
{
    [Theory]
    [InlineData("None", SeedProfile.None)]
    [InlineData("Prod", SeedProfile.Prod)]
    [InlineData("Staging", SeedProfile.Staging)]
    [InlineData("Dev", SeedProfile.Dev)]
    [InlineData("dev", SeedProfile.Dev)]
    [InlineData("PROD", SeedProfile.Prod)]
    public void ResolveProfile_FromEnvironment_ParsesCorrectly(string envValue, SeedProfile expected)
    {
        // Arrange
        Environment.SetEnvironmentVariable("SEED_PROFILE", envValue);
        try
        {
            // Act
            var result = SeedOrchestrator.ResolveProfile(null);

            // Assert
            result.Should().Be(expected);
        }
        finally
        {
            Environment.SetEnvironmentVariable("SEED_PROFILE", null);
        }
    }

    [Fact]
    public void ResolveProfile_FromConfig_WhenNoEnvVar()
    {
        // Arrange
        Environment.SetEnvironmentVariable("SEED_PROFILE", null);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Seeding:Profile"] = "Staging" })
            .Build();

        // Act
        var result = SeedOrchestrator.ResolveProfile(config);

        // Assert
        result.Should().Be(SeedProfile.Staging);
    }

    [Fact]
    public void ResolveProfile_DefaultsToDev_WhenNothingConfigured()
    {
        // Arrange
        Environment.SetEnvironmentVariable("SEED_PROFILE", null);

        // Act
        var result = SeedOrchestrator.ResolveProfile(null);

        // Assert
        result.Should().Be(SeedProfile.Dev);
    }

    [Fact]
    public void FilterLayers_ReturnsOnlyMatchingLayers()
    {
        // Arrange
        var core = new Mock<ISeedLayer>();
        core.Setup(l => l.MinimumProfile).Returns(SeedProfile.Prod);
        core.Setup(l => l.Name).Returns("Core");

        var catalog = new Mock<ISeedLayer>();
        catalog.Setup(l => l.MinimumProfile).Returns(SeedProfile.Staging);
        catalog.Setup(l => l.Name).Returns("Catalog");

        var livedIn = new Mock<ISeedLayer>();
        livedIn.Setup(l => l.MinimumProfile).Returns(SeedProfile.Dev);
        livedIn.Setup(l => l.Name).Returns("LivedIn");

        var layers = new[] { core.Object, catalog.Object, livedIn.Object };

        // Act - Prod profile should only run Core
        var prodLayers = SeedOrchestrator.FilterLayers(layers, SeedProfile.Prod).ToList();
        var stagingLayers = SeedOrchestrator.FilterLayers(layers, SeedProfile.Staging).ToList();
        var devLayers = SeedOrchestrator.FilterLayers(layers, SeedProfile.Dev).ToList();

        // Assert
        prodLayers.Should().HaveCount(1).And.Contain(core.Object);
        stagingLayers.Should().HaveCount(2);
        devLayers.Should().HaveCount(3);
    }

    [Fact]
    public void FilterLayers_OrdersByMinimumProfile()
    {
        // Arrange - register in reverse order
        var livedIn = new Mock<ISeedLayer>();
        livedIn.Setup(l => l.MinimumProfile).Returns(SeedProfile.Dev);
        livedIn.Setup(l => l.Name).Returns("LivedIn");

        var core = new Mock<ISeedLayer>();
        core.Setup(l => l.MinimumProfile).Returns(SeedProfile.Prod);
        core.Setup(l => l.Name).Returns("Core");

        var layers = new[] { livedIn.Object, core.Object };

        // Act
        var result = SeedOrchestrator.FilterLayers(layers, SeedProfile.Dev).ToList();

        // Assert - should be ordered by MinimumProfile (Prod first, then Dev)
        result[0].Name.Should().Be("Core");
        result[1].Name.Should().Be("LivedIn");
    }
}
