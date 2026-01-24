using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

public class CloudinaryPhotoStorage : IPhotoStorage
{
    private readonly Cloudinary _cloudinary;
    private readonly CloudinarySettings _settings;

    private static readonly HashSet<string> _allowed = new(StringComparer.OrdinalIgnoreCase)
    { "image/jpeg", "image/png", "image/webp" };

    public CloudinaryPhotoStorage(Cloudinary cloudinary, IOptions<CloudinarySettings> settings)
    {
        _cloudinary = cloudinary;
        _settings = settings.Value;
    }

    public async Task<(string Url, string PublicId)> UploadAsync(int petId, IFormFile file, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0) throw new InvalidOperationException("Empty file.");
        if (!_allowed.Contains(file.ContentType)) throw new InvalidOperationException("Invalid content-type.");

        await using var stream = file.OpenReadStream();

        var upload = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = $"{_settings.Folder}/{petId}", // ví dụ: pawnder/pets/123
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
            // Không dùng transformation để upload nhanh hơn
            // Cloudinary sẽ tự động optimize khi deliver
        };

        // Set timeout 30s cho upload
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(30));

        var result = await _cloudinary.UploadAsync(upload, cts.Token);
        if (result.StatusCode is not System.Net.HttpStatusCode.OK || string.IsNullOrEmpty(result.SecureUrl?.AbsoluteUri))
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error?.Message}");

        return (result.SecureUrl!.AbsoluteUri, result.PublicId!);
    }

    public async Task DeleteAsync(string publicId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(publicId)) return;
        var del = await _cloudinary.DestroyAsync(new DeletionParams(publicId));


        // del.Result == "ok" hoặc "not found"
    }
}
