namespace BE.Services
{
    public class Validate
    {
        public bool IsValidValueByType(string? value, string? typeValue)
        {
            if (string.IsNullOrWhiteSpace(typeValue))
                return true; 

            switch (typeValue.ToLower())
            {
                case "string":
                    return !string.IsNullOrEmpty(value);

                case "float":
                    return float.TryParse(value, out _);

                case "boolean":
                    return bool.TryParse(value, out _);

                default:
                    return false; 
            }
        }

    }
}
