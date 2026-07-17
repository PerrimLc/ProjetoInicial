namespace SaaSAgents.Api.Models;

public class CompanySettings
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = "";
    public string CompanyEmail { get; set; } = "";
    public string CompanyPhone { get; set; } = "";
    public string CompanyWebsite { get; set; } = "";
    public bool WhatsappConnected { get; set; } = false;
    public string OpenAiKey { get; set; } = "";
    public string DefaultModel { get; set; } = "GPT-4o";
    public double DefaultTemperature { get; set; } = 0.7;
    public string DefaultPrompt { get; set; } = "";
    public string Language { get; set; } = "pt-BR";
    public bool NotificationsEnabled { get; set; } = true;
    public bool TwoFactor { get; set; } = false;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
