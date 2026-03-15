using Api.Infrastructure.Entities.UserNotifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.EntityConfigurations.UserNotifications;

/// <summary>
/// EF Core configuration for SlackTeamChannelConfigEntity.
/// Configures table mapping, indexes, and constraints for team channel webhook configurations.
/// </summary>
internal class SlackTeamChannelConfigEntityConfiguration : IEntityTypeConfiguration<SlackTeamChannelConfigEntity>
{
    public void Configure(EntityTypeBuilder<SlackTeamChannelConfigEntity> builder)
    {
        builder.ToTable("slack_team_channel_configs");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(e => e.ChannelName).HasColumnName("channel_name").HasMaxLength(100).IsRequired();
        builder.Property(e => e.WebhookUrl).HasColumnName("webhook_url").IsRequired();
        builder.Property(e => e.NotificationTypes).HasColumnName("notification_types").HasColumnType("jsonb").IsRequired();
        builder.Property(e => e.IsEnabled).HasColumnName("is_enabled").IsRequired();
        builder.Property(e => e.OverridesDefault).HasColumnName("overrides_default").IsRequired();

        // Unique channel name
        builder.HasIndex(e => e.ChannelName)
            .HasDatabaseName("IX_slack_team_channel_configs_channel_name")
            .IsUnique();

        // Enabled channels filter
        builder.HasIndex(e => e.IsEnabled)
            .HasDatabaseName("IX_slack_team_channel_configs_is_enabled")
            .HasFilter("is_enabled = true");
    }
}
