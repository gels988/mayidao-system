using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

// Admin Tool for MAYIJU System
// Usage: dotnet run <phone> <amount>
// Example: dotnet run 13800000000 1000

class Program
{
    private static readonly string SUPABASE_URL = "https://xhfyfkqfykkbbnlwghem.supabase.co";
    // NOTE: In production, use the Service Role Key. For now, we use the Anon Key but the function is protected by a secret.
    private static readonly string SUPABASE_KEY = "sb_publishable_vQhs5uK79eOi1lMUqGuM5g_j1rPWGXU";
    private static readonly string ADMIN_SECRET = "MAYIJU_ADMIN_SECRET_2026";

    static async Task Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.WriteLine("Usage: AdminTool <phone> <amount>");
            return;
        }

        string phone = args[0];
        if (!int.TryParse(args[1], out int amount))
        {
            Console.WriteLine("Invalid amount");
            return;
        }

        Console.WriteLine($"Topping up {phone} with {amount} G-Coins...");

        try
        {
            await TopUpUser(phone, amount);
            Console.WriteLine("Success!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }

    static async Task TopUpUser(string phone, int amount)
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Add("apikey", SUPABASE_KEY);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {SUPABASE_KEY}");

            var payload = new
            {
                p_phone = phone,
                p_amount = amount,
                p_secret = ADMIN_SECRET
            };

            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{SUPABASE_URL}/rest/v1/rpc/admin_top_up", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"HTTP {response.StatusCode}: {error}");
            }
        }
    }
}
