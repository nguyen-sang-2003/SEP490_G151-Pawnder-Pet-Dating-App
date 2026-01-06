import { getPetsByUserId, getPetPhotos, getPetById } from '../features/pet/api/petApi';

/**
 * Get pet photo by petId
 * Returns URI or default cat avatar
 */
export const getPetAvatar = async (petId: number): Promise<any> => {
  try {
    if (!petId) {
      return require('../assets/cat_avatar.png');
    }

    const petPhotos = await getPetPhotos(petId);
    
    if (!petPhotos || petPhotos.length === 0) {
      return require('../assets/cat_avatar.png');
    }

    const primaryPhoto = petPhotos.find((photo: any) => 
      photo.isPrimary || photo.IsPrimary
    );
    
    if (primaryPhoto) {
      const photoUrl = primaryPhoto.ImageUrl || primaryPhoto.imageUrl || 
                       primaryPhoto.PhotoUrl || primaryPhoto.photoUrl || 
                       primaryPhoto.url || primaryPhoto.Url;
      if (photoUrl) {
        return { uri: photoUrl };
      }
    }

    const firstPhoto = petPhotos[0];
    const photoUrl = firstPhoto.ImageUrl || firstPhoto.imageUrl || 
                     firstPhoto.PhotoUrl || firstPhoto.photoUrl || 
                     firstPhoto.url || firstPhoto.Url;
    
    if (photoUrl) {
      return { uri: photoUrl };
    }

    return require('../assets/cat_avatar.png');
  } catch (error) {
    return require('../assets/cat_avatar.png');
  }
};

/**
 * Get primary pet photo for user avatar (uses ACTIVE pet)
 * Returns URI or default cat avatar
 */
export const getUserPetAvatar = async (userId: number): Promise<any> => {
  try {
    const pets = await getPetsByUserId(userId);
    
    if (!pets || pets.length === 0) {
      return require('../assets/cat_avatar.png');
    }

    const activePet = pets.find(p => p.IsActive === true || p.isActive === true);
    const targetPet = activePet || pets[0];
    const petId = targetPet.petId || targetPet.PetId;
    
    if (!petId) {
      return require('../assets/cat_avatar.png');
    }

    const petPhotos = await getPetPhotos(petId);
    
    if (!petPhotos || petPhotos.length === 0) {
      return require('../assets/cat_avatar.png');
    }

    const primaryPhoto = petPhotos.find((photo: any) => 
      photo.isPrimary || photo.IsPrimary
    );
    
    if (primaryPhoto) {
      const photoUrl = primaryPhoto.ImageUrl || primaryPhoto.imageUrl || 
                       primaryPhoto.PhotoUrl || primaryPhoto.photoUrl || 
                       primaryPhoto.url || primaryPhoto.Url;
      if (photoUrl) {
        return { uri: photoUrl };
      }
    }

    const firstPhoto = petPhotos[0];
    const photoUrl = firstPhoto.ImageUrl || firstPhoto.imageUrl || 
                     firstPhoto.PhotoUrl || firstPhoto.photoUrl || 
                     firstPhoto.url || firstPhoto.Url;
    
    if (photoUrl) {
      return { uri: photoUrl };
    }

    return require('../assets/cat_avatar.png');
  } catch (error) {
    return require('../assets/cat_avatar.png');
  }
};

