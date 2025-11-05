import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPets } from '../../data/mockPets';
import { mockUsers } from '../../data/mockUsers';
import './PetsList.css';

const PetsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Helper function để lấy owner info từ mockUsers
  const getOwnerInfo = (ownerId) => {
    const owner = mockUsers.find(u => u.id === ownerId);
    if (owner) {
      return {
        ownerName: `${owner.firstName} ${owner.lastName}`,
        ownerEmail: owner.email,
        ownerPhone: owner.phone
      };
    }
    return { ownerName: 'Unknown', ownerEmail: 'unknown@email.com', ownerPhone: 'N/A' };
  };

  // Dữ liệu thú cưng từ mock data - enrich với owner info từ mockUsers
  const pets = mockPets.map(pet => ({
    ...pet,
    ...getOwnerInfo(pet.ownerId)
  }));

  // Lọc và tìm kiếm
  const filteredPets = pets.filter(pet => {
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = filterSpecies === 'all' || pet.species === filterSpecies;
    
    return matchesSearch && matchesSpecies;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredPets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPets = filteredPets.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePetClick = (petId) => {
    navigate(`/pets/${petId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };


  const getSpeciesIcon = (species) => {
    return '🐱'; // Chỉ có mèo
  };

  const getVaccinationBadge = (isVaccinated) => {
    return isVaccinated ? (
      <span className="vaccinated-badge">✓ Đã tiêm phòng</span>
    ) : (
      <span className="unvaccinated-badge">✗ Chưa tiêm phòng</span>
    );
  };

  const getNeuteredBadge = (isNeutered) => {
    return isNeutered ? (
      <span className="neutered-badge">✓ Đã triệt sản</span>
    ) : (
      <span className="not-neutered-badge">✗ Chưa triệt sản</span>
    );
  };

  return (
    <div className="pets-page">
      <div className="page-header">
        <h1>Quản lý thú cưng</h1>
        <p>Danh sách tất cả thú cưng trong hệ thống</p>
      </div>

      <div className="pets-controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, giống, chủ sở hữu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả loài</option>
            <option value="Cat">Mèo</option>
          </select>
        </div>
      </div>

      <div className="pets-stats">
        <div className="stat-card">
          <span className="stat-number">{pets.length}</span>
          <span className="stat-label">Tổng thú cưng</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{pets.filter(p => p.species === 'Cat').length}</span>
          <span className="stat-label">Mèo</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{pets.filter(p => p.isVaccinated).length}</span>
          <span className="stat-label">Đã tiêm phòng</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{pets.filter(p => p.isNeutered).length}</span>
          <span className="stat-label">Đã triệt sản</span>
        </div>
      </div>

      <div className="pets-table-container">
        <table className="pets-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Thông tin thú cưng</th>
              <th>Chủ sở hữu</th>
              <th>Sức khỏe</th>
              <th>Thống kê</th>
              <th>Ngày tạo</th>
              <th>Cập nhật cuối</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentPets.map((pet) => (
              <tr key={pet.id}>
                <td>
                  <div className="pet-photo">
                    {pet.photos && pet.photos.length > 0 ? (
                      <img src={pet.photos[0]} alt={pet.name} />
                    ) : (
                      <div className="photo-placeholder">
                        {getSpeciesIcon(pet.species)}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="pet-info">
                    <div className="pet-name">
                      {getSpeciesIcon(pet.species)} {pet.name}
                    </div>
                    <div className="pet-breed">{pet.breed}</div>
                    <div className="pet-details">
                      {pet.gender} • {pet.age} tuổi • {pet.weight}kg • {pet.color}
                    </div>
                    <div className="pet-description">{pet.description}</div>
                  </div>
                </td>
                <td>
                  <div className="owner-info">
                    <div className="owner-name">{pet.ownerName}</div>
                    <div className="owner-email">{pet.ownerEmail}</div>
                    <div className="owner-id">ID: {pet.ownerId}</div>
                  </div>
                </td>
                <td>
                  <div className="health-info">
                    <div className="health-item">
                      {getVaccinationBadge(pet.isVaccinated)}
                    </div>
                    <div className="health-item">
                      {getNeuteredBadge(pet.isNeutered)}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="pet-stats">
                    <div className="stat-item">
                      <span className="stat-label">Ghép đôi:</span>
                      <span className="stat-value">{pet.totalMatches}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Lượt thích:</span>
                      <span className="stat-value">{pet.totalLikes}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Ảnh:</span>
                      <span className="stat-value">{pet.photos ? pet.photos.length : 0}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <div>{formatDate(pet.createdAt)}</div>
                    <div className="time-info">{new Date(pet.createdAt).toLocaleTimeString('vi-VN')}</div>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <div>{formatDate(pet.updatedAt)}</div>
                    <div className="time-info">{new Date(pet.updatedAt).toLocaleTimeString('vi-VN')}</div>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePetClick(pet.id);
                      }}
                      title="Xem chi tiết thú cưng"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn prev"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Trước
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn next"
          >
            Sau
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PetsList;