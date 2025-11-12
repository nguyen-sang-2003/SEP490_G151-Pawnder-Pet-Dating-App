import { getPetsByUserId, getPetPhotos } from '../api/pet';

/**
 * Get primary pet photo for user avatar
 * Returns URI or default cat avatar
 */
export const getUserPetAvatar = async (userId: number): Promise<any> => {
  try {
    console.log('🔍 Getting pet avatar for userId:', userId);
    
    // Get user's pets
    const pets = await getPetsByUserId(userId);
    console.log('🐾 User pets:', pets);
    
    if (!pets || pets.length === 0) {
      console.log('⚠️ No pets found for user');
      return require('../assets/cat_avatar.png');
    }

    const firstPet = pets[0];
    const petId = firstPet.petId || firstPet.PetId;
    
    if (!petId) {
      console.log('⚠️ No petId found');
      return require('../assets/cat_avatar.png');
    }

    // Get first pet's photos
    const petPhotos = await getPetPhotos(petId);
    console.log('📸 Pet photos:', petPhotos);
    
    if (!petPhotos || petPhotos.length === 0) {
      console.log('⚠️ No photos found for pet');
      return require('../assets/cat_avatar.png');
    }

    // Find primary photo (check both camelCase and PascalCase)
    const primaryPhoto = petPhotos.find((photo: any) => 
      photo.isPrimary || photo.IsPrimary
    );
    
    if (primaryPhoto) {
      // Backend uses "ImageUrl" field
      const photoUrl = primaryPhoto.ImageUrl || primaryPhoto.imageUrl || 
                       primaryPhoto.PhotoUrl || primaryPhoto.photoUrl || 
                       primaryPhoto.url || primaryPhoto.Url;
      if (photoUrl) {
        console.log('✅ Using primary photo:', photoUrl);
        return { uri: photoUrl };
      }
    }

    // Fallback to first photo if no primary
    const firstPhoto = petPhotos[0];
    // Backend uses "ImageUrl" field
    const photoUrl = firstPhoto.ImageUrl || firstPhoto.imageUrl || 
                     firstPhoto.PhotoUrl || firstPhoto.photoUrl || 
                     firstPhoto.url || firstPhoto.Url;
    
    if (photoUrl) {
      console.log('✅ Using first photo:', photoUrl);
      return { uri: photoUrl };
    }

    console.log('⚠️ No valid photo URL found');
    return require('../assets/cat_avatar.png');
  } catch (error) {
    console.log('❌ Error loading pet avatar for user:', userId, error);
    return require('../assets/cat_avatar.png');
  }
};

