import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockPets } from '../../data/mockPets';
import { mockUsers } from '../../data/mockUsers';
import './PetDetail.css';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Tìm pet từ mockPets và enrich với owner info từ mockUsers
  const basePet = mockPets.find(p => p.id === parseInt(id));
  const pet = basePet ? {
    ...basePet,
    ...getOwnerInfo(basePet.ownerId),
    // Mở rộng description nếu cần (trong mockPets description ngắn hơn)
    description: basePet.description || 'Chưa có mô tả'
  } : null;

  if (!pet) {
    return (
      <div className="pet-detail-page">
        <div className="error-message">
          <h2>Không tìm thấy thú cưng</h2>
          <p>Thú cưng với ID {id} không tồn tại.</p>
          <button onClick={() => navigate('/pets')} className="back-btn">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? pet.photos.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === pet.photos.length - 1 ? 0 : prev + 1
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getSpeciesIcon = (species) => {
    return species === 'Dog' ? '🐕' : '🐱';
  };


  return (
    <div className="pet-detail-page">
      <div className="page-header">
        <button onClick={() => navigate('/pets')} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Quay lại danh sách
        </button>
        <h1>Chi tiết thú cưng</h1>
      </div>

      <div className="pet-detail-content">
        {/* Pet Photos Section */}
        <div className="photos-section">
          <h2>Ảnh của {pet.name}</h2>
          <div className="photo-gallery">
            <div className="main-photo-container">
              <button 
                className="nav-btn prev-btn"
                onClick={handlePrevImage}
                disabled={pet.photos.length <= 1}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              
              <div className="main-photo">
                <img 
                  src={pet.photos[currentImageIndex]} 
                  alt={`${pet.name} - Ảnh ${currentImageIndex + 1}`}
                />
                <div className="photo-counter">
                  {currentImageIndex + 1} / {pet.photos.length}
                </div>
              </div>
              
              <button 
                className="nav-btn next-btn"
                onClick={handleNextImage}
                disabled={pet.photos.length <= 1}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
            
            {pet.photos.length > 1 && (
              <div className="thumbnail-gallery">
                {pet.photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`thumbnail-item ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={photo} alt={`${pet.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pet Information Section */}
        <div className="info-section">
          <div className="pet-basic-info">
            <h2>
              {getSpeciesIcon(pet.species)} {pet.name}
            </h2>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <h3>Thông tin cơ bản</h3>
              <div className="info-item">
                <span className="label">Giống:</span>
                <span className="value">{pet.breed}</span>
              </div>
              <div className="info-item">
                <span className="label">Tuổi:</span>
                <span className="value">{pet.age} tuổi</span>
              </div>
              <div className="info-item">
                <span className="label">Giới tính:</span>
                <span className="value">{pet.gender}</span>
              </div>
              <div className="info-item">
                <span className="label">Cân nặng:</span>
                <span className="value">{pet.weight} kg</span>
              </div>
              <div className="info-item">
                <span className="label">Màu sắc:</span>
                <span className="value">{pet.color}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Sức khỏe</h3>
              <div className="info-item">
                <span className="label">Tiêm phòng:</span>
                <span className={`value ${pet.isVaccinated ? 'vaccinated' : 'unvaccinated'}`}>
                  {pet.isVaccinated ? '✓ Đã tiêm phòng' : '✗ Chưa tiêm phòng'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Triệt sản:</span>
                <span className={`value ${pet.isNeutered ? 'neutered' : 'not-neutered'}`}>
                  {pet.isNeutered ? '✓ Đã triệt sản' : '✗ Chưa triệt sản'}
                </span>
              </div>
            </div>

            <div className="info-card">
              <h3>Chủ sở hữu</h3>
              <div className="info-item">
                <span className="label">Tên:</span>
                <span className="value">{pet.ownerName}</span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{pet.ownerEmail}</span>
              </div>
              <div className="info-item">
                <span className="label">Số điện thoại:</span>
                <span className="value">{pet.ownerPhone}</span>
              </div>
              <div className="info-item">
                <span className="label">ID:</span>
                <span className="value">{pet.ownerId}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Thống kê</h3>
              <div className="info-item">
                <span className="label">Ghép đôi:</span>
                <span className="value">{pet.totalMatches}</span>
              </div>
              <div className="info-item">
                <span className="label">Lượt thích:</span>
                <span className="value">{pet.totalLikes}</span>
              </div>
              <div className="info-item">
                <span className="label">Số ảnh:</span>
                <span className="value">{pet.photos.length}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Thời gian</h3>
              <div className="info-item">
                <span className="label">Ngày tạo:</span>
                <span className="value">{formatDate(pet.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="label">Cập nhật cuối:</span>
                <span className="value">{formatDate(pet.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="description-card">
            <h3>Mô tả</h3>
            <p>{pet.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;