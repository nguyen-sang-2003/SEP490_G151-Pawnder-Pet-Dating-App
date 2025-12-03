import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, petService, petPhotoService } from '../../shared/api';
import './styles/PetsList.css';

const PetsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Pets data state
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  
  // Pet stats (for summary cards)
  // Cache for users and pets to avoid refetching
  const usersCacheRef = useRef([]);
  const petsCacheRef = useRef([]);

  // Fetch all pets by fetching all users and their pets
  useEffect(() => {
    const fetchAllPets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        if (petsCacheRef.current.length > 0) {
          setPets(petsCacheRef.current);
          setLoading(false);
          return;
        }
        
        // Fetch all users first
        const usersResponse = await userService.getUsers({
          page: 1,
          pageSize: 1000, // Get all users
          includeDeleted: false
        });
        
        const allUsers = usersResponse.Items || usersResponse.items || [];
        usersCacheRef.current = allUsers;
        
        // Fetch pets for each user (in parallel)
        const petPromises = allUsers.map(async (user) => {
          const userId = user.UserId || user.userId;
          if (!userId) return [];
          
          try {
            const petsResponse = await petService.getPetsByUser(userId);
            const userPets = Array.isArray(petsResponse) ? petsResponse : [];
            
            // Get owner info
            const fullName = user.FullName || user.fullName || user.Email?.split('@')[0] || 'Unknown';
            
            // Enrich each pet with owner info and fetch photos
            const enrichedPets = await Promise.all(userPets.map(async (pet) => {
              const petId = pet.PetId || pet.petId;
              
              // Fetch photos for this pet
              let photos = [];
              try {
                const photosResponse = await petPhotoService.getPhotosByPet(petId);
                photos = Array.isArray(photosResponse) 
                  ? photosResponse.map(p => p.Url || p.url || p.ImageUrl || p.imageUrl || '')
                  : [];
                photos = photos.filter(url => url); // Remove empty strings
              } catch (err) {
                console.warn(`Error fetching photos for pet ${petId}:`, err);
                // Use avatar if available
                if (pet.UrlImageAvatar || pet.urlImageAvatar) {
                  photos = [pet.UrlImageAvatar || pet.urlImageAvatar];
                }
              }
              
              return {
                id: petId,
                name: pet.Name || pet.name || 'Unknown',
                breed: pet.Breed || pet.breed || 'Unknown',
                gender: pet.Gender || pet.gender || 'Unknown',
                age: pet.Age || pet.age || 0,
                species: 'Cat', // App chỉ có mèo
                weight: null, // Backend doesn't have weight
                color: null, // Backend doesn't have color
                description: pet.Description || pet.description || '',
                isActive: pet.IsActive || pet.isActive || false,
                isVaccinated: false, // Backend doesn't have this field
                isNeutered: false, // Backend doesn't have this field
                photos: photos.length > 0 ? photos : (pet.UrlImageAvatar || pet.urlImageAvatar ? [pet.UrlImageAvatar || pet.urlImageAvatar] : []),
                ownerId: userId,
                ownerName: fullName,
                ownerEmail: user.Email || user.email || 'unknown@email.com',
                ownerPhone: null, // Backend doesn't have phone
                createdAt: null, // Backend doesn't return CreatedAt in PetDto
                updatedAt: null, // Backend doesn't return UpdatedAt in PetDto
                totalMatches: 0, // Backend doesn't have this
                totalLikes: 0 // Backend doesn't have this
              };
            }));
            
            return enrichedPets;
          } catch (err) {
            console.warn(`Error fetching pets for user ${userId}:`, err);
            return [];
          }
        });
        
        // Wait for all pet promises to resolve
        const petArrays = await Promise.all(petPromises);
        const allPets = petArrays.flat();
        
        // Filter out null/undefined pets
        const validPets = allPets.filter(pet => pet !== null && pet !== undefined);
        
        // Cache pets
        petsCacheRef.current = validPets;
        setPets(validPets);
        
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Không thể tải danh sách thú cưng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllPets();
  }, []); // Only run once on mount


  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Memoize filtered pets to avoid recalculating on every render
  const filteredPets = useMemo(() => {
    return pets.filter(pet => {
      const matchesSearch = 
        (pet.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pet.breed || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pet.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pet.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [pets, searchTerm]);

  // Update total pages when filtered pets change
  useEffect(() => {
    const total = filteredPets.length;
    setTotalPages(Math.ceil(total / itemsPerPage));
  }, [filteredPets, itemsPerPage]);

  // Memoize current pets (paginated)
  const currentPets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPets.slice(startIndex, endIndex);
  }, [filteredPets, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePetClick = (petId) => {
    navigate(`/pets/${petId}`);
  };

  const getSpeciesIcon = (species) => {
    return '🐱'; // Chỉ có mèo
  };

  if (loading && pets.length === 0) {
    return (
      <div className="pets-page">
        <div className="page-header">
          <h1>Quản lý thú cưng</h1>
          <p>Đang tải dữ liệu...</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pets-page">
        <div className="page-header">
          <h1>Quản lý thú cưng</h1>
          <p style={{ color: '#e74c3c' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pets-page">
      <div className="page-header">
        <h1>Quản lý thú cưng</h1>
        <p>Danh sách tất cả thú cưng trong hệ thống</p>
      </div>

      <div className="pets-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, giống, chủ sở hữu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Species filter removed per request */}
      </div>

      <div className="pets-table-container">
        <table className="pets-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Thông tin thú cưng</th>
              <th>Chủ sở hữu</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentPets.length > 0 ? (
              currentPets.map((pet) => (
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
                      {pet.gender} • {pet.age} tuổi
                      {pet.weight && ` • ${pet.weight}kg`}
                      {pet.color && ` • ${pet.color}`}
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
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Không tìm thấy thú cưng nào
                </td>
              </tr>
            )}
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