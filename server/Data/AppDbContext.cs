using Microsoft.EntityFrameworkCore;
using SaaSAgents.Api.Models;

namespace SaaSAgents.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Agent> Agents => Set<Agent>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<KnowledgeDocument> KnowledgeDocuments => Set<KnowledgeDocument>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<CompanySettings> Settings => Set<CompanySettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.Settings)
            .WithOne(s => s.User)
            .HasForeignKey<CompanySettings>(s => s.UserId);

        modelBuilder.Entity<Lead>()
            .Property(l => l.EstimatedValue)
            .HasColumnType("REAL");

        modelBuilder.Entity<Agent>()
            .Property(a => a.Temperature)
            .HasColumnType("REAL");

        modelBuilder.Entity<CompanySettings>()
            .Property(s => s.DefaultTemperature)
            .HasColumnType("REAL");
    }
}
