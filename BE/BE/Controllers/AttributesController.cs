// BE/Controllers/AttributeController.cs
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.DTO;
using BE.Models;
using AttributeEntity = BE.Models.Attribute; // tránh đụng System.Attribute

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttributeController : ControllerBase
    {
        private readonly PawnderDatabaseContext _db;

        public AttributeController(PawnderDatabaseContext db)
        {
            _db = db;
        }

        // GET: api/attribute?search=&page=1&pageSize=20&includeDeleted=false
        [HttpGet]
        public async Task<ActionResult> GetList(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] bool includeDeleted = false,
            CancellationToken ct = default)
        {
            if (page <= 0 || pageSize <= 0)
                return BadRequest(new { message = "Tham số phân trang không hợp lệ." });

            try
            {
                var q = _db.Attributes.AsNoTracking().AsQueryable();

                if (!includeDeleted)
                    q = q.Where(a => a.IsDeleted == false);

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var keyword = search.Trim();
                    q = q.Where(a =>
                        a.Name.Contains(keyword) ||
                        (a.TypeValue != null && a.TypeValue.Contains(keyword)) ||
                        (a.Unit != null && a.Unit.Contains(keyword)));
                }

                var total = await q.CountAsync(ct);
                var items = await q
                    .OrderBy(a => a.Attributeid)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new AttributeResponse
                    {
                        AttributeId = a.Attributeid,
                        Name = a.Name,
                        TypeValue = a.TypeValue,
                        Unit = a.Unit,
                        IsDeleted = a.IsDeleted,
                        CreatedAt = a.CreatedAt,
                        UpdatedAt = a.UpdatedAt
                    })
                    .ToListAsync(ct);

                return Ok(new
                {
                    message = "Lấy danh sách thuộc tính thành công.",
                    pagination = new { page, pageSize, total },
                    data = items
                });
            }
            catch (Exception)
            {
                return Problem(title: "Lỗi hệ thống",
                               detail: "Đã xảy ra lỗi khi lấy danh sách thuộc tính. Vui lòng thử lại sau.",
                               statusCode: 500);
            }
        }

        // GET: api/attribute/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult> GetById([FromRoute] int id, CancellationToken ct = default)
        {
            try
            {
                var entity = await _db.Attributes.AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Attributeid == id, ct);

                if (entity == null)
                    return NotFound(new { message = "Không tìm thấy thuộc tính." });

                var dto = new AttributeResponse
                {
                    AttributeId = entity.Attributeid,
                    Name = entity.Name,
                    TypeValue = entity.TypeValue,
                    Unit = entity.Unit,
                    IsDeleted = entity.IsDeleted,
                    CreatedAt = entity.CreatedAt,
                    UpdatedAt = entity.UpdatedAt
                };

                return Ok(new { message = "Lấy thông tin thuộc tính thành công.", data = dto });
            }
            catch (Exception)
            {
                return Problem(title: "Lỗi hệ thống",
                               detail: "Không thể tải thông tin thuộc tính. Vui lòng thử lại sau.",
                               statusCode: 500);
            }
        }

        // POST: api/attribute
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] AttributeCreateRequest request, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                // kiểm tra trùng tên (không phân biệt hoa thường)
                var exists = await _db.Attributes
                    .AnyAsync(a => a.IsDeleted == false && a.Name.ToLower() == request.Name.ToLower(), ct);

                if (exists)
                    return Conflict(new { message = "Tên thuộc tính đã tồn tại." });

                var now = DateTime.Now;
                var entity = new AttributeEntity
                {
                    Name = request.Name.Trim(),
                    TypeValue = request.TypeValue?.Trim(),
                    Unit = request.Unit?.Trim(),
                    IsDeleted = request.IsDeleted,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _db.Attributes.Add(entity);
                await _db.SaveChangesAsync(ct);

                var response = new AttributeResponse
                {
                    AttributeId = entity.Attributeid,
                    Name = entity.Name,
                    TypeValue = entity.TypeValue,
                    Unit = entity.Unit,
                    IsDeleted = entity.IsDeleted,
                    CreatedAt = entity.CreatedAt,
                    UpdatedAt = entity.UpdatedAt
                };

                return CreatedAtAction(nameof(GetById), new { id = entity.Attributeid },
                    new { message = "Tạo thuộc tính thành công.", data = response });
            }
            catch (DbUpdateException)
            {
                return Problem(title: "Lỗi cơ sở dữ liệu",
                               detail: "Không thể lưu thuộc tính. Vui lòng kiểm tra dữ liệu và thử lại.",
                               statusCode: 500);
            }
            catch (Exception)
            {
                return Problem(title: "Lỗi hệ thống",
                               detail: "Đã xảy ra lỗi khi tạo thuộc tính.",
                               statusCode: 500);
            }
        }

        // PUT: api/attribute/5
        [HttpPut("{id:int}")]
        public async Task<ActionResult> Update([FromRoute] int id, [FromBody] AttributeUpdateRequest request, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var entity = await _db.Attributes.FirstOrDefaultAsync(a => a.Attributeid == id, ct);
                if (entity == null)
                    return NotFound(new { message = "Không tìm thấy thuộc tính để cập nhật." });

                // kiểm tra trùng tên (ngoại trừ chính nó)
                var duplicate = await _db.Attributes
                    .AnyAsync(a => a.Attributeid != id
                                   && a.IsDeleted == false
                                   && a.Name.ToLower() == request.Name.ToLower(), ct);
                if (duplicate)
                    return Conflict(new { message = "Tên thuộc tính đã tồn tại." });

                entity.Name = request.Name.Trim();
                entity.TypeValue = request.TypeValue?.Trim();
                entity.Unit = request.Unit?.Trim();
                if (request.IsDeleted.HasValue) entity.IsDeleted = request.IsDeleted.Value;
                entity.UpdatedAt = DateTime.Now;

                await _db.SaveChangesAsync(ct);

                return Ok(new { message = "Cập nhật thuộc tính thành công." });
            }
            catch (DbUpdateConcurrencyException)
            {
                return Problem(title: "Xung đột dữ liệu",
                               detail: "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại và thử lại.",
                               statusCode: 409);
            }
            catch (DbUpdateException)
            {
                return Problem(title: "Lỗi cơ sở dữ liệu",
                               detail: "Không thể cập nhật thuộc tính. Vui lòng kiểm tra dữ liệu và thử lại.",
                               statusCode: 500);
            }
            catch (Exception)
            {
                return Problem(title: "Lỗi hệ thống",
                               detail: "Đã xảy ra lỗi khi cập nhật thuộc tính.",
                               statusCode: 500);
            }
        }

        // DELETE: api/attribute/5?hard=false
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> Delete([FromRoute] int id, [FromQuery] bool hard = false, CancellationToken ct = default)
        {
            try
            {
                var entity = await _db.Attributes.FirstOrDefaultAsync(a => a.Attributeid == id, ct);
                if (entity == null)
                    return NotFound(new { message = "Không tìm thấy thuộc tính để xoá." });

                if (hard)
                {
                    _db.Attributes.Remove(entity);
                }
                else
                {
                    if (entity.IsDeleted == true)
                        return BadRequest(new { message = "Thuộc tính đã ở trạng thái xoá mềm." });
                    entity.IsDeleted = true;
                    entity.UpdatedAt = DateTime.Now;
                }

                await _db.SaveChangesAsync(ct);
                return Ok(new { message = hard ? "Đã xoá vĩnh viễn thuộc tính." : "Đã xoá mềm thuộc tính." });
            }
            catch (DbUpdateException)
            {
                return Problem(title: "Lỗi cơ sở dữ liệu",
                               detail: "Không thể xoá thuộc tính do ràng buộc dữ liệu. Hãy kiểm tra các tham chiếu liên quan.",
                               statusCode: 409);
            }
            catch (Exception)
            {
                return Problem(title: "Lỗi hệ thống",
                               detail: "Đã xảy ra lỗi khi xoá thuộc tính.",
                               statusCode: 500);
            }
        }
    }
}
