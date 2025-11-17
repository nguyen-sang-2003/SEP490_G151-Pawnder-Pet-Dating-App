namespace BE.Exceptions
{
    public class QuotaExceededException : Exception
    {
        public bool IsVip { get; set; }
        public int DailyQuota { get; set; }
        public int TokensUsed { get; set; }
        public int TokensRemaining { get; set; }

        public QuotaExceededException(
            string message, 
            bool isVip, 
            int dailyQuota, 
            int tokensUsed, 
            int tokensRemaining) 
            : base(message)
        {
            IsVip = isVip;
            DailyQuota = dailyQuota;
            TokensUsed = tokensUsed;
            TokensRemaining = tokensRemaining;
        }
    }
}
