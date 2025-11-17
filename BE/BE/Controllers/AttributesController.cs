using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho Attribute - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AttributeController : ControllerBase
    {
        private readonly IAttributeService _attributeService;

        public AttributeController(IAttributeService attributeService)
        {
            _attributeService = attributeService;
        }

        // GET: api/attribute?search=&page=1&pageSize=20&includeDeleted=false
        [HttpGet]
        [Authorize(Roles = "User,Admin")]
        public async Task<ActionResult> GetList(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] bool includeDeleted = false,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _attributeService.GetAttributesAsync(search, page, pageSize, includeDeleted, ct);
                return Ok(new
                {
                    message = "Lấy danh sách thuộc tính thành công.",
                    pagination = new { page, pageSize, total = result.Total },
                    data = result.Items
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET: api/attribute/5
        [HttpGet("{id:int}")]
        [Authorize(Roles = "User,Admin")]
        public async Task<ActionResult> GetById([FromRoute] int id, CancellationToken ct = default)
        {
            try
            {
                var dto = await _attributeService.GetAttributeByIdAsync(id, ct);
                
                if (dto == null)
                    return NotFound(new { message = "Không tìm thấy thuộc tính." });

                return Ok(new { message = "Lấy thông tin thuộc tính thành công.", data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST: api/attribute
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Create([FromBody] AttributeCreateRequest request, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var response = await _attributeService.CreateAttributeAsync(request, ct);
                return CreatedAtAction(nameof(GetById), new { id = response.AttributeId },
                    new { message = "Tạo thuộc tính thành công.", data = response });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT: api/attribute/5
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Update([FromRoute] int id, [FromBody] AttributeUpdateRequest request, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var success = await _attributeService.UpdateAttributeAsync(id, request, ct);
                return Ok(new { message = "Cập nhật thuộc tính thành công." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // DELETE: api/attribute/5?hard=false
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete([FromRoute] int id, [FromQuery] bool hard = false, CancellationToken ct = default)
        {
            try
            {
                var success = await _attributeService.DeleteAttributeAsync(id, hard, ct);
                return Ok(new { message = hard ? "Đã xoá vĩnh viễn thuộc tính." : "Đã xoá mềm thuộc tính." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET: api/attribute/for-filter
        [HttpGet("for-filter")]
        [Authorize(Roles = "User,Admin")]
        public async Task<ActionResult> GetAttributesForFilter(CancellationToken ct = default)
        {
            try
            {
                var result = await _attributeService.GetAttributesForFilterAsync(ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }
    }
}
