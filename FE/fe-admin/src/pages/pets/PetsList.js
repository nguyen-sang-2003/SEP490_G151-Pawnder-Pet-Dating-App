import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PetsList.css';

const PetsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dữ liệu thú cưng mẫu với đầy đủ trường database
  const pets = [
    {
      id: 1,
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      gender: 'Male',
      weight: 25.5,
      color: 'Golden',
      description: 'Friendly and energetic dog who loves playing fetch',
      ownerId: 1,
      ownerName: 'John Doe',
      ownerEmail: 'john.doe@email.com',
      status: 'active',
      isVaccinated: true,
      isNeutered: false,
      createdAt: '2024-01-20T10:30:00Z',
      updatedAt: '2024-10-28T14:20:00Z',
      photos: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
      totalMatches: 5,
      totalLikes: 12
    },
    {
      id: 2,
      name: 'Luna',
      species: 'Cat',
      breed: 'Persian',
      age: 2,
      gender: 'Female',
      weight: 4.2,
      color: 'White',
      description: 'Calm and elegant cat, perfect for apartment living',
      ownerId: 2,
      ownerName: 'Alice Wonder',
      ownerEmail: 'alice.wonder@email.com',
      status: 'active',
      isVaccinated: true,
      isNeutered: true,
      createdAt: '2024-02-15T14:20:00Z',
      updatedAt: '2024-10-27T16:45:00Z',
      photos: ['https://via.placeholder.com/300x200'],
      totalMatches: 3,
      totalLikes: 8
    },
    {
      id: 3,
      name: 'Max',
      species: 'Dog',
      breed: 'German Shepherd',
      age: 5,
      gender: 'Male',
      weight: 32.0,
      color: 'Black and Tan',
      description: 'Loyal and protective, great with families',
      ownerId: 3,
      ownerName: 'Bob Smith',
      ownerEmail: 'bob.smith@email.com',
      status: 'inactive',
      isVaccinated: false,
      isNeutered: true,
      createdAt: '2024-03-10T09:15:00Z',
      updatedAt: '2024-10-20T09:10:00Z',
      photos: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
      totalMatches: 0,
      totalLikes: 2
    },
    {
      id: 4,
      name: 'Whiskers',
      species: 'Cat',
      breed: 'Maine Coon',
      age: 4,
      gender: 'Male',
      weight: 6.8,
      color: 'Orange Tabby',
      description: 'Large and fluffy cat, very social and playful',
      ownerId: 4,
      ownerName: 'Sarah Jones',
      ownerEmail: 'sarah.jones@email.com',
      status: 'active',
      isVaccinated: true,
      isNeutered: false,
      createdAt: '2024-04-05T11:30:00Z',
      updatedAt: '2024-10-28T12:15:00Z',
      photos: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
      totalMatches: 8,
      totalLikes: 15
    },
    {
      id: 5,
      name: 'Bella',
      species: 'Dog',
      breed: 'French Bulldog',
      age: 2,
      gender: 'Female',
      weight: 12.5,
      color: 'Brindle',
      description: 'Small but energetic, loves attention and treats',
      ownerId: 5,
      ownerName: 'Mike Wilson',
      ownerEmail: 'mike.wilson@email.com',
      status: 'banned',
      isVaccinated: true,
      isNeutered: true,
      createdAt: '2024-05-12T16:45:00Z',
      updatedAt: '2024-10-25T10:30:00Z',
      photos: ['https://via.placeholder.com/300x200'],
      totalMatches: 2,
      totalLikes: 5
    },
    {
      id: 6,
      name: 'Simba',
      species: 'Cat',
      breed: 'Siamese',
      age: 1,
      gender: 'Male',
      weight: 3.5,
      color: 'Seal Point',
      description: 'Young and active cat, very vocal and intelligent',
      ownerId: 6,
      ownerName: 'Emma Brown',
      ownerEmail: 'emma.brown@email.com',
      status: 'active',
      isVaccinated: true,
      isNeutered: false,
      createdAt: '2024-06-18T13:20:00Z',
      updatedAt: '2024-10-28T15:45:00Z',
      photos: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
      totalMatches: 6,
      totalLikes: 11
    },
    {
      id: 7,
      name: 'Rocky',
      species: 'Dog',
      breed: 'Labrador',
      age: 6,
      gender: 'Male',
      weight: 28.0,
      color: 'Chocolate',
      description: 'Mature and calm dog, great with children',
      ownerId: 7,
      ownerName: 'David Lee',
      ownerEmail: 'david.lee@email.com',
      status: 'active',
      isVaccinated: false,
      isNeutered: true,
      createdAt: '2024-07-25T10:10:00Z',
      updatedAt: '2024-10-28T08:20:00Z',
      photos: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
      totalMatches: 4,
      totalLikes: 9
    },
    {
      id: 8,
      name: 'Mittens',
      species: 'Cat',
      breed: 'Ragdoll',
      age: 3,
      gender: 'Female',
      weight: 5.2,
      color: 'Blue Point',
      description: 'Gentle and docile cat, perfect lap companion',
      ownerId: 8,
      ownerName: 'Lisa Garcia',
      ownerEmail: 'lisa.garcia@email.com',
      status: 'inactive',
      isVaccinated: true,
      isNeutered: true,
      createdAt: '2024-08-30T15:30:00Z',
      updatedAt: '2024-10-15T12:40:00Z',
      photos: ['https://via.placeholder.com/300x200'],
      totalMatches: 1,
      totalLikes: 3
    },
    {
      id: 9,
      name: 'Charlie',
      species: 'Dog',
      breed: 'Beagle',
      age: 4,
      gender: 'Male',
      weight: 18.0,
      color: 'Tri-color',
      description: 'Friendly and curious dog, loves exploring',
      ownerId: 1,
      ownerName: 'John Doe',
      ownerEmail: 'john.doe@email.com',
      status: 'active',
      isVaccinated: true,
      isNeutered: false,
      createdAt: '2024-09-10T12:00:00Z',
      updatedAt: '2024-10-28T11:30:00Z',
      photos: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
      totalMatches: 7,
      totalLikes: 14
    },
    {
      id: 10,
      name: 'Princess',
      species: 'Cat',
      breed: 'British Shorthair',
      age: 2,
      gender: 'Female',
      weight: 4.8,
      color: 'Blue',
      description: 'Elegant and independent cat with beautiful blue eyes',
      ownerId: 2,
      ownerName: 'Alice Wonder',
      ownerEmail: 'alice.wonder@email.com',
      status: 'active',
      isVaccinated: true,
      isNeutered: true,
      createdAt: '2024-10-05T14:15:00Z',
      updatedAt: '2024-10-28T13:45:00Z',
      photos: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
      totalMatches: 4,
      totalLikes: 7
    }
  ];

  // Lọc và tìm kiếm
  const filteredPets = pets.filter(pet => {
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || pet.status === filterStatus;
    const matchesSpecies = filterSpecies === 'all' || pet.species === filterSpecies;
    
    return matchesSearch && matchesStatus && matchesSpecies;
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: '#27ae60', text: 'Hoạt động' },
      inactive: { color: '#f39c12', text: 'Không hoạt động' },
      banned: { color: '#e74c3c', text: 'Bị cấm' }
    };
    
    const config = statusConfig[status] || { color: '#95a5a6', text: 'Không xác định' };
    
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    );
  };

  const getSpeciesIcon = (species) => {
    return species === 'Dog' ? '🐕' : '🐱';
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="banned">Bị cấm</option>
          </select>
        </div>

        <div className="filter-section">
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả loài</option>
            <option value="Dog">Chó</option>
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
          <span className="stat-number">{pets.filter(p => p.status === 'active').length}</span>
          <span className="stat-label">Đang hoạt động</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{pets.filter(p => p.species === 'Dog').length}</span>
          <span className="stat-label">Chó</span>
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
              <th>Trạng thái</th>
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
                  {getStatusBadge(pet.status)}
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
                    <button 
                      className="action-btn edit"
                      onClick={(e) => e.stopPropagation()}
                      title="Chỉnh sửa thú cưng"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={(e) => e.stopPropagation()}
                      title="Xóa thú cưng"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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