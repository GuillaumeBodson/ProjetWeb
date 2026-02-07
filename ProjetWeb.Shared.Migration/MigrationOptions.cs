namespace ProjetWeb.Shared.Migration;
public class MigrationOptions
{
    public const string Key = "Migration";
    public bool StopAfterExecution { get; set; } = true;
}