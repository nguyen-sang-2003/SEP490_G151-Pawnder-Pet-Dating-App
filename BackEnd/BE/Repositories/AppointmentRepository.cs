using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories;

public class AppointmentRepository : BaseRepository<PetAppointment>, IAppointmentRepository
{
    public AppointmentRepository(PawnderDatabaseContext context) : base(context)
    {
    }

    public async Task<IEnumerable<PetAppointment>> GetByMatchIdAsync(int matchId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(a => a.InviterPet)
            .Include(a => a.InviteePet)
            .Include(a => a.InviterUser)
            .Include(a => a.InviteeUser)
            .Include(a => a.Location)
            .Where(a => a.MatchId == matchId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<PetAppointment>> GetByUserIdAsync(int userId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(a => a.InviterPet)
            .Include(a => a.InviteePet)
            .Include(a => a.InviterUser)
            .Include(a => a.InviteeUser)
            .Include(a => a.Location)
            .Where(a => a.InviterUserId == userId || a.InviteeUserId == userId)
            .OrderByDescending(a => a.AppointmentDateTime)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<PetAppointment>> GetByStatusAsync(string status, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(a => a.InviterPet)
            .Include(a => a.InviteePet)
            .Include(a => a.Location)
            .Where(a => a.Status == status)
            .OrderByDescending(a => a.AppointmentDateTime)
            .ToListAsync(ct);
    }

    public async Task<PetAppointment?> GetByIdWithDetailsAsync(int appointmentId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(a => a.Match)
            .Include(a => a.InviterPet)
                .ThenInclude(p => p.PetPhotos.Where(ph => ph.IsPrimary == true))
            .Include(a => a.InviteePet)
                .ThenInclude(p => p.PetPhotos.Where(ph => ph.IsPrimary == true))
            .Include(a => a.InviterUser)
            .Include(a => a.InviteeUser)
            .Include(a => a.Location)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId, ct);
    }

    public async Task<IEnumerable<PetAppointment>> GetUpcomingAppointmentsForReminderAsync(
        DateTime reminderTime, 
        CancellationToken ct = default)
    {
        // Lấy các cuộc hẹn confirmed, sắp đến giờ hẹn trong khoảng ±30 phút so với reminderTime
        var startWindow = reminderTime.AddMinutes(-30);
        var endWindow = reminderTime.AddMinutes(30);

        return await _dbSet
            .Include(a => a.InviterUser)
            .Include(a => a.InviteeUser)
            .Include(a => a.InviterPet)
            .Include(a => a.InviteePet)
            .Where(a => 
                a.Status == "confirmed" &&
                a.AppointmentDateTime >= startWindow &&
                a.AppointmentDateTime <= endWindow)
            .ToListAsync(ct);
    }

    public async Task<int> CountMessagesBetweenUsersAsync(int matchId, CancellationToken ct = default)
    {
        return await _context.ChatUserContents
            .CountAsync(c => c.MatchId == matchId, ct);
    }

    public async Task<bool> IsPetProfileCompleteAsync(int petId, CancellationToken ct = default)
    {
        var pet = await _context.Pets
            .Include(p => p.PetPhotos)
            .FirstOrDefaultAsync(p => p.PetId == petId && p.IsDeleted != true, ct);

        if (pet == null) return false;

        // Kiểm tra: có tên, giống, và ít nhất 1 ảnh
        return !string.IsNullOrWhiteSpace(pet.Name) &&
               !string.IsNullOrWhiteSpace(pet.Breed) &&
               pet.PetPhotos.Any(ph => ph.IsDeleted != true);
    }
}
