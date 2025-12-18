import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { petService, petPhotoService, userService } from '../../shared/api';
import './styles/PetDetail.css';

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Pet data state
  const [pet, setPet] = useState(null);
  const [characteristics, setCharacteristics] = useState([]);
  const [characteristicsError, setCharacteristicsError] = useState(null); // Track if characteristics endpoint is not available
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pet data from API
  useEffect(() => {
    const fetchPetData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const petId = parseInt(id);
        if (isNaN(petId)) {
          setError('ID thú cưng không hợp lệ');
          setLoading(false);
          return;
        }
        
        // Fetch pet, photos, and characteristics in parallel
        // Note: PetDto_1 doesn't include UserId, so we need to fetch it separately
        // First, try to get pet details
        let characteristicsFailed = false;
        const [petResponse, photosResponse, characteristicsResponse] = await Promise.all([
          petService.getPetById(petId).catch(err => {
            console.error('Error fetching pet:', err);
            return null;
          }),
          petPhotoService.getPhotosByPet(petId).catch(err => {
            console.warn('Error fetching photos:', err);
            return [];
          }),
          petService.getPetCharacteristics(petId).catch(err => {
            // Log error for debugging
            console.warn('[PetDetail] Error fetching characteristics:', {
              status: err?.response?.status,
              message: err?.message,
              url: err?.config?.url
            });
            // Mark as failed - we'll show error message instead of "Chưa có đặc điểm"
            characteristicsFailed = true;
            return null; // Return null to distinguish from empty array
          })
        ]);
        
        if (!petResponse) {
          setError('Không tìm thấy thú cưng');
          setLoading(false);
          return;
        }
        
        // Map photos
        let photos = [];
        if (Array.isArray(photosResponse) && photosResponse.length > 0) {
          photos = photosResponse.map(p => p.Url || p.url || p.ImageUrl || p.imageUrl || '').filter(url => url);
        } else if (petResponse.UrlImage && Array.isArray(petResponse.UrlImage)) {
          photos = petResponse.UrlImage.filter(url => url);
        } else if (petResponse.urlImage && Array.isArray(petResponse.urlImage)) {
          photos = petResponse.urlImage.filter(url => url);
        }
        
        // If no photos, use empty array
        if (photos.length === 0) {
          photos = [];
        }
        
        // Map pet data
        const mappedPet = {
          id: petResponse.PetId || petResponse.petId,
          name: petResponse.Name || petResponse.name || 'Unknown',
          breed: petResponse.Breed || petResponse.breed || 'Unknown',
          gender: petResponse.Gender || petResponse.gender || 'Unknown',
          age: petResponse.Age || petResponse.age || 0,
          species: 'Cat', // App chỉ có mèo
          weight: null, // Backend doesn't have weight
          color: null, // Backend doesn't have color
          description: petResponse.Description || petResponse.description || 'Chưa có mô tả',
          isActive: petResponse.IsActive || petResponse.isActive || false,
          isVaccinated: false, // Backend doesn't have this field
          isNeutered: false, // Backend doesn't have this field
          photos: photos,
          ownerId: null, // PetDto_1 doesn't include UserId
          ownerName: 'Unknown',
          ownerEmail: 'unknown@email.com',
          ownerPhone: null,
          createdAt: null, // Backend doesn't return CreatedAt in PetDto_1
          updatedAt: null, // Backend doesn't return UpdatedAt in PetDto_1
          totalMatches: 0, // Backend doesn't have this
          totalLikes: 0 // Backend doesn't have this
        };
        
        // Try to get owner info
        // NOTE: PetDto_1 doesn't include UserId, so we need to find owner by checking users
        // This is inefficient - backend should include UserId in PetDto_1
        // For now, we'll try a limited search (first 50 users) to avoid too many API calls
        try {
          const usersResponse = await userService.getUsers({
            page: 1,
            pageSize: 50, // Limit to first 50 users to avoid too many API calls
            includeDeleted: false
          });
          
          const users = usersResponse.Items || usersResponse.items || [];
          
          // Find the owner by checking which user has this pet (in parallel, but limit concurrency)
          let ownerFound = null;
          const checkPromises = users.slice(0, 20).map(async (user) => {
            try {
              const userId = user.UserId || user.userId;
              if (!userId) return null;
              
              const userPets = await petService.getPetsByUser(userId);
              if (Array.isArray(userPets)) {
                const hasPet = userPets.some(p => (p.PetId || p.petId) === petId);
                if (hasPet) {
                  return user;
                }
              }
            } catch (err) {
              // Skip this user if error
              return null;
            }
            return null;
          });
          
          const results = await Promise.all(checkPromises);
          ownerFound = results.find(r => r !== null);
          
          if (ownerFound) {
            const fullName = ownerFound.FullName || ownerFound.fullName || ownerFound.Email?.split('@')[0] || 'Unknown';
            mappedPet.ownerId = ownerFound.UserId || ownerFound.userId;
            mappedPet.ownerName = fullName;
            mappedPet.ownerEmail = ownerFound.Email || ownerFound.email || 'unknown@email.com';
            mappedPet.ownerPhone = null; // Backend doesn't have phone
            
          } else {
            console.warn('Owner not found in first 50 users. PetDto_1 should include UserId.');
          }
        } catch (err) {
          console.warn('Error fetching owner info:', err);
          // Continue without owner info
        }
        
        setPet(mappedPet);
        
        // Handle characteristics - check if API call failed
        if (characteristicsFailed) {
          setCharacteristicsError('error');
          setCharacteristics([]);
          console.log('[PetDetail] Characteristics API failed');
        } else {
          const characteristicsArray = Array.isArray(characteristicsResponse) ? characteristicsResponse : [];
          setCharacteristics(characteristicsArray);
          setCharacteristicsError(null);
          console.log('[PetDetail] Characteristics loaded:', characteristicsArray.length, 'items');
        }
      } catch (err) {
        console.error('Error fetching pet data:', err);
        setError('Không thể tải thông tin thú cưng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPetData();
  }, [id]);

  const handlePrevImage = () => {
    if (pet.photos && pet.photos.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? pet.photos.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (pet.photos && pet.photos.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === pet.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getSpeciesIcon = (species) => {
    return '🐱'; // App chỉ có mèo
  };
  
  if (loading) {
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
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
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
        <div className="error-message">
          <h2>{error || 'Không tìm thấy thú cưng'}</h2>
          <p>Thú cưng với ID {id} không tồn tại.</p>
          <button onClick={() => navigate('/pets')} className="back-btn">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }


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
          {pet.photos && pet.photos.length > 0 ? (
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
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    }}
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
                      <img 
                        src={photo} 
                        alt={`${pet.name} ${index + 1}`}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-photos">
              <div className="no-photos-icon">🐾</div>
              <p>Chưa có ảnh</p>
            </div>
          )}
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
              {pet.weight && (
                <div className="info-item">
                  <span className="label">Cân nặng:</span>
                  <span className="value">{pet.weight} kg</span>
                </div>
              )}
              {pet.color && (
                <div className="info-item">
                  <span className="label">Màu sắc:</span>
                  <span className="value">{pet.color}</span>
                </div>
              )}
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
              {pet.ownerPhone && (
                <div className="info-item">
                  <span className="label">Số điện thoại:</span>
                  <span className="value">{pet.ownerPhone}</span>
                </div>
              )}
              {pet.ownerId && (
                <div className="info-item">
                  <span className="label">ID:</span>
                  <span className="value">{pet.ownerId}</span>
                </div>
              )}
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
                <span className="value">{pet.photos ? pet.photos.length : 0}</span>
              </div>
            </div>

          </div>

          <div className="description-card">
            <h3>Mô tả</h3>
            <p>{pet.description}</p>
          </div>

          {/* Always show characteristics section */}
          <div className="info-card">
            <h3>Đặc điểm</h3>
            {characteristics.length > 0 ? (
              <div className="characteristics-list">
                {characteristics.map((char, index) => (
                  <div key={index} className="characteristic-item">
                    <span className="label">{char.name}:</span>
                    <span className="value">
                      {char.optionValue || (char.value !== null && char.value !== undefined 
                        ? `${char.value}${char.unit ? ' ' + char.unit : ''}` 
                        : 'N/A')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic', margin: 0, padding: '1rem 0' }}>
                {characteristicsError ? (
                  <span>
                    Không thể tải đặc điểm
                    <br />
                    <small style={{ fontSize: '0.85em', opacity: 0.7 }}>
                      (Endpoint chưa có trên production)
                    </small>
                  </span>
                ) : (
                  'Chưa có đặc điểm'
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;