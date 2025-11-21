using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
	/// <summary>
	/// Controller cho Address - chỉ nhận request và trả response
	/// </summary>
	[ApiController]
	[Route("[controller]")]
	public class AddressController : ControllerBase
	{
		private readonly IAddressService _addressService;

		public AddressController(IAddressService addressService)
		{
			_addressService = addressService;
		}

		[HttpPost("{userId}")]
		[Authorize(Roles = "User")]
		public async Task<IActionResult> CreateAddressForUser(int userId, [FromBody] LocationDto locationDto, CancellationToken ct = default)
		{
			try
			{
				var result = await _addressService.CreateAddressForUserAsync(userId, locationDto, ct);
				return Ok(result);
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

		// PUT: /address/{addressId}
		[HttpPut("{addressId}")]
		[Authorize(Roles = "User")]
		public async Task<IActionResult> UpdateAddress(int addressId, [FromBody] LocationDto locationDto, CancellationToken ct = default)
		{
			try
			{
				var result = await _addressService.UpdateAddressAsync(addressId, locationDto, ct);
				return Ok(result);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		// PATCH: /address/{addressId}/manual
		[HttpPatch("{addressId}/manual")]
		[Authorize(Roles = "User")]
		public async Task<IActionResult> UpdateAddressManual(int addressId, [FromBody] ManualAddressDto dto, CancellationToken ct = default)
		{
			try
			{
				var result = await _addressService.UpdateAddressManualAsync(addressId, dto, ct);
				return Ok(result);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		// GET: /address/{addressId}
		[HttpGet("{addressId}")]
		[Authorize(Roles = "User,Admin")]
		public async Task<IActionResult> GetAddressById(int addressId, CancellationToken ct = default)
		{
			try
			{
				var result = await _addressService.GetAddressByIdAsync(addressId, ct);
				return Ok(result);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}
	}
}
	


