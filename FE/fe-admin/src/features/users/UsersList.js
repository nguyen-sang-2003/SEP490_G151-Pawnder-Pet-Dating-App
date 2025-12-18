import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { userService, petService } from '../../shared/api';
import { STORAGE_KEYS } from '../../shared/constants';
import './styles/UsersList.css';

const ROLE_ID = {
  ADMIN: 1,
  EXPERT: 2,
  USER: 3
};

const UsersList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Users data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);

  // User stats (for summary cards)
  const [userStats, setUserStats] = useState({
    total: 0,
    normal: 0,
    premium: 0,
    verified: 0
  });

  // User pets count (cache to avoid multiple API calls)
  const userPetsCountRef = useRef({});

  // Ban user states
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDuration, setBanDuration] = useState('1'); // 1 day, 3 days, 7 days, 1 month, 3 months, permanent
  const [banReason, setBanReason] = useState('');
  const [userBans, setUserBans] = useState({}); // { userId: { banExpiresAt: timestamp, reason: string } }

  // Unban modal states
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUserForUnban, setSelectedUserForUnban] = useState(null);
  const [unbanTimeRemaining, setUnbanTimeRemaining] = useState(null);
  const unbanExpiresAtRef = useRef(null);

  // Timer for countdown
  const [timeRemaining, setTimeRemaining] = useState(null);
  const intervalRef = useRef(null);
  const banExpiresAtRef = useRef(null); // Store original banExpiresAt to prevent recalculation

  // Load ban data from localStorage
  useEffect(() => {
    const savedBans = localStorage.getItem(STORAGE_KEYS.USER_BANS);
    if (savedBans) {
      try {
        const bans = JSON.parse(savedBans);
        setUserBans(bans);
      } catch (error) {
        console.error('Error parsing user bans:', error);
      }
    }
  }, []);

  // Check and auto-unban users when ban expires
  useEffect(() => {
    // Define USER_STATUS constant inside useEffect to avoid dependency warning
    const NORMAL_STATUS = 2; // USER_STATUS.NORMAL

    const checkAndUnban = () => {
      const now = Date.now();
      setUserBans(prevBans => {
        const updatedBans = { ...prevBans };
        let hasChanges = false;
        const userIdsToUnban = [];

        Object.keys(updatedBans).forEach(userId => {
          const ban = updatedBans[userId];
          // permanent ban has banExpiresAt === null
          if (ban.banExpiresAt && ban.banExpiresAt <= now) {
            delete updatedBans[userId];
            userIdsToUnban.push(userId);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          // Update backend for each unbanned user - call unban API to update UserBanHistory
          userIdsToUnban.forEach(async (userId) => {
            try {
              // Call unban API to update UserBanHistory (set IsActive = false, BanEnd = now)
              // This will also update UserStatusId based on payment history
              await userService.unbanUser(parseInt(userId));
              console.log(`✅ Auto-unbanned user ${userId} - ban expired`);

              // Fetch updated user data from backend to get correct status
              try {
                const updatedUserResponse = await userService.getUserById(parseInt(userId));
                if (updatedUserResponse) {
                  const userStatusId = parseInt(updatedUserResponse.UserStatusId || updatedUserResponse.userStatusId) || 2;
                  let status = 'NORMAL';
                  if (userStatusId === 3) { // PREMIUM
                    status = 'PREMIUM';
                  } else if (userStatusId === 1) { // BANNED
                    status = 'BANNED';
                  }

                  // Update users state with data from backend
                  setUsers(prevUsers =>
                    prevUsers.map(user =>
                      user.id.toString() === userId
                        ? {
                          ...user,
                          status: status,
                          userStatusId: userStatusId,
                          updatedAt: updatedUserResponse.UpdatedAt || updatedUserResponse.updatedAt
                        }
                        : user
                    )
                  );

                  // Set timestamp to notify UserDetail to refresh
                  localStorage.setItem(`${STORAGE_KEYS.USER_UPDATED_TIMESTAMP}_${userId}`, Date.now().toString());
                }
              } catch (fetchError) {
                console.error(`Error fetching updated user data for ${userId}:`, fetchError);
                // Fallback: set to NORMAL if fetch fails
                setUsers(prevUsers =>
                  prevUsers.map(user =>
                    user.id.toString() === userId
                      ? { ...user, status: 'NORMAL', userStatusId: NORMAL_STATUS }
                      : user
                  )
                );
              }
            } catch (error) {
              console.error(`❌ Error auto-unbanning user ${userId}:`, error);
              // If unban API fails, fallback to update UserStatusId directly
              try {
                await userService.updateUserByAdmin(parseInt(userId), {
                  userStatusId: NORMAL_STATUS
                });
              } catch (fallbackError) {
                console.error(`❌ Fallback unban also failed for user ${userId}:`, fallbackError);
              }
            }
          });

          localStorage.setItem(STORAGE_KEYS.USER_BANS, JSON.stringify(updatedBans));
        }

        return updatedBans;
      });
    };

    // Check immediately
    checkAndUnban();

    // Check every 10 seconds for more responsive updates
    intervalRef.current = setInterval(checkAndUnban, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Update countdown timer when ban modal is open
  useEffect(() => {
    if (showBanModal && selectedUser) {
      // Get ban info once when modal opens and store banExpiresAt in ref
      const ban = userBans[selectedUser.id];

      if (ban && ban.banExpiresAt) {
        // Store the original banExpiresAt in ref to prevent it from changing
        // This value is fixed and will never change, ensuring countdown decreases correctly
        banExpiresAtRef.current = ban.banExpiresAt;

        const updateCountdown = () => {
          const now = Date.now();
          // Always use the original banExpiresAt from ref, never recalculate
          const originalBanExpiresAt = banExpiresAtRef.current;
          if (!originalBanExpiresAt) return;

          const remaining = originalBanExpiresAt - now;

          if (remaining > 0) {
            setTimeRemaining(remaining);
          } else {
            setTimeRemaining(0);
            // Ban has expired, remove it
            banExpiresAtRef.current = null;
            setUserBans(prevBans => {
              const updatedBans = { ...prevBans };
              delete updatedBans[selectedUser.id];
              localStorage.setItem(STORAGE_KEYS.USER_BANS, JSON.stringify(updatedBans));
              return updatedBans;
            });

            // Update backend - call unban API to update UserBanHistory
            userService.unbanUser(selectedUser.id)
              .then(() => {
                console.log(`✅ Auto-unbanned user ${selectedUser.id} - ban expired`);
              })
              .catch(err => {
                console.error('❌ Error auto-unbanning user:', err);
                // Fallback: if unban API fails, try to update UserStatusId directly
                return userService.updateUserByAdmin(selectedUser.id, {
                  userStatusId: USER_STATUS.NORMAL
                });
              });

            // Update users state
            setUsers(prevUsers =>
              prevUsers.map(user =>
                user.id === selectedUser.id
                  ? { ...user, status: 'NORMAL', userStatusId: USER_STATUS.NORMAL }
                  : user
              )
            );
          }
        };

        // Update immediately
        updateCountdown();

        // Update every second to show countdown
        const countdownInterval = setInterval(updateCountdown, 1000);

        return () => {
          clearInterval(countdownInterval);
          banExpiresAtRef.current = null;
        };
      } else {
        setTimeRemaining(null); // Permanent ban or no ban
        banExpiresAtRef.current = null;
      }
    } else {
      setTimeRemaining(null);
      banExpiresAtRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBanModal, selectedUser?.id]); // Only depend on selectedUser.id, not userBans to prevent recalculation

  // Update countdown timer for unban modal
  useEffect(() => {
    if (showUnbanModal && selectedUserForUnban) {
      const ban = userBans[selectedUserForUnban.id];

      if (ban && ban.banExpiresAt) {
        unbanExpiresAtRef.current = ban.banExpiresAt;

        const updateCountdown = () => {
          const now = Date.now();
          const originalBanExpiresAt = unbanExpiresAtRef.current;
          if (!originalBanExpiresAt) return;

          const remaining = originalBanExpiresAt - now;

          if (remaining > 0) {
            setUnbanTimeRemaining(remaining);
          } else {
            setUnbanTimeRemaining(0);
          }
        };

        // Update immediately
        updateCountdown();

        // Update every second to show countdown
        const countdownInterval = setInterval(updateCountdown, 1000);

        return () => {
          clearInterval(countdownInterval);
          unbanExpiresAtRef.current = null;
        };
      } else {
        setUnbanTimeRemaining(null);
        unbanExpiresAtRef.current = null;
      }
    } else {
      setUnbanTimeRemaining(null);
      unbanExpiresAtRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnbanModal, selectedUserForUnban?.id]);

  // Helper function to check if user is banned
  const isUserBanned = (userId) => {
    return userBans[userId] !== undefined;
  };

  // Helper function to get ban info
  const getBanInfo = (userId) => {
    return userBans[userId] || null;
  };

  // Helper function to format time remaining
  const formatTimeRemaining = (ms) => {
    if (ms === null) return 'Vĩnh viễn';
    if (ms <= 0) return 'Đã hết hạn';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days} ngày ${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút ${seconds} giây`;
    } else if (minutes > 0) {
      return `${minutes} phút ${seconds} giây`;
    } else {
      return `${seconds} giây`;
    }
  };

  // Handle open ban modal
  const handleOpenBanModal = (user) => {
    setSelectedUser(user);
    setBanDuration('1');
    setBanReason('');
    setShowBanModal(true);

    // If user is already banned, show current ban info
    if (userBans[user.id]) {
      const ban = userBans[user.id];
      if (ban.banExpiresAt) {
        const remaining = ban.banExpiresAt - Date.now();
        setTimeRemaining(remaining > 0 ? remaining : 0);
      } else {
        setTimeRemaining(null);
      }
    }
  };

  // Handle close ban modal
  const handleCloseBanModal = () => {
    setShowBanModal(false);
    setSelectedUser(null);
    setBanDuration('1');
    setBanReason('');
    setTimeRemaining(null);
  };

  // Handle ban user
  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      alert('Vui lòng nhập lý do ban!');
      return;
    }

    try {
      // Prepare ban data for backend API
      const isPermanent = banDuration === 'permanent';
      const durationDays = isPermanent ? 0 : parseInt(banDuration);

      // Call backend ban API to create UserBanHistory entry
      // Backend expects: { Reason: string, durationDays: int, isPermanent: bool }
      const banData = {
        Reason: banReason.trim(),
        durationDays: durationDays,
        isPermanent: isPermanent
      };

      const banResponse = await userService.banUser(selectedUser.id, banData);

      // Calculate ban expiration time for frontend display
      const existingBan = userBans[selectedUser.id];
      let banExpiresAt = null;

      // IMPORTANT: If user is already banned, NEVER recalculate banExpiresAt
      // Keep the original banExpiresAt to ensure countdown continues correctly
      if (existingBan && existingBan.banExpiresAt && !isPermanent) {
        // User is already banned - keep the original banExpiresAt
        banExpiresAt = existingBan.banExpiresAt;
      } else {
        // New ban - calculate ban expiration time from backend response or calculate locally
        if (isPermanent) {
          banExpiresAt = null;
        } else {
          // Use banEnd from backend response if available, otherwise calculate
          if (banResponse?.banEnd) {
            banExpiresAt = new Date(banResponse.banEnd).getTime();
          } else {
            const now = Date.now();
            switch (banDuration) {
              case '1': // 1 day
                banExpiresAt = now + (1 * 24 * 60 * 60 * 1000);
                break;
              case '3': // 3 days
                banExpiresAt = now + (3 * 24 * 60 * 60 * 1000);
                break;
              case '7': // 7 days
                banExpiresAt = now + (7 * 24 * 60 * 60 * 1000);
                break;
              case '30': // 1 month
                banExpiresAt = now + (30 * 24 * 60 * 60 * 1000);
                break;
              case '90': // 3 months
                banExpiresAt = now + (90 * 24 * 60 * 60 * 1000);
                break;
              default:
                banExpiresAt = now + (1 * 24 * 60 * 60 * 1000);
            }
          }
        }
      }

      const updatedBans = {
        ...userBans,
        [selectedUser.id]: {
          banExpiresAt,
          reason: banReason.trim(),
          bannedAt: existingBan?.bannedAt || Date.now() // Keep original bannedAt if exists
        }
      };

      setUserBans(updatedBans);
      localStorage.setItem(STORAGE_KEYS.USER_BANS, JSON.stringify(updatedBans));

      // Update ref if modal is open
      if (showBanModal && selectedUser && banExpiresAt) {
        banExpiresAtRef.current = banExpiresAt;
      }

      // Update user status in local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? { ...user, status: 'BANNED', userStatusId: USER_STATUS.BANNED }
            : user
        )
      );

      // Set timestamp to notify UserDetail to refresh
      localStorage.setItem(`${STORAGE_KEYS.USER_UPDATED_TIMESTAMP}_${selectedUser.id}`, Date.now().toString());

      alert(banResponse?.message || 'Đã ban người dùng thành công!');
      handleCloseBanModal();
    } catch (error) {
      console.error('Error banning user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể ban người dùng. Vui lòng thử lại sau.';
      alert(errorMessage);
    }
  };

  // Handle open unban modal
  const handleOpenUnbanModal = (user) => {
    setSelectedUserForUnban(user);
    setShowUnbanModal(true);

    // Initialize time remaining if user is banned
    const ban = userBans[user.id];
    if (ban && ban.banExpiresAt) {
      const remaining = ban.banExpiresAt - Date.now();
      setUnbanTimeRemaining(remaining > 0 ? remaining : 0);
    } else {
      setUnbanTimeRemaining(null);
    }
  };

  // Handle close unban modal
  const handleCloseUnbanModal = () => {
    setShowUnbanModal(false);
    setSelectedUserForUnban(null);
    setUnbanTimeRemaining(null);
  };

  // Handle unban user from modal
  const handleUnbanUserDirect = async () => {
    if (!selectedUserForUnban) return;

    try {
      console.log(`[Unban] Starting unban for user ${selectedUserForUnban.id}...`);

      // Call backend unban API
      await userService.unbanUser(selectedUserForUnban.id);
      console.log(`[Unban] Backend unban API called successfully`);

      // Remove from localStorage bans
      const updatedBans = { ...userBans };
      delete updatedBans[selectedUserForUnban.id];

      setUserBans(updatedBans);
      localStorage.setItem(STORAGE_KEYS.USER_BANS, JSON.stringify(updatedBans));
      console.log(`[Unban] Removed user ${selectedUserForUnban.id} from localStorage bans`);

      // Wait a bit for backend to process (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch updated user data from backend to get correct status
      // Retry up to 3 times in case backend is still processing
      let updatedUserResponse = null;
      const maxRetries = 3;

      for (let retries = 0; retries < maxRetries; retries++) {
        try {
          const response = await userService.getUserById(selectedUserForUnban.id);
          console.log(`[Unban] Fetch attempt ${retries + 1}:`, response);

          if (response) {
            updatedUserResponse = response;
            // Map UserStatusId to status string
            const userStatusId = parseInt(response.UserStatusId || response.userStatusId) || 2;
            console.log(`[Unban] Parsed UserStatusId: ${userStatusId} (original: ${response.UserStatusId || response.userStatusId})`);

            let status = 'NORMAL';
            if (userStatusId === USER_STATUS.PREMIUM) {
              status = 'PREMIUM';
            } else if (userStatusId === USER_STATUS.BANNED) {
              status = 'BANNED';
            }

            console.log(`[Unban] Mapped status: ${status} (from UserStatusId: ${userStatusId})`);

            // Update user status in local state with data from backend
            setUsers(prevUsers =>
              prevUsers.map(u =>
                u.id === selectedUserForUnban.id
                  ? {
                    ...u,
                    status: status,
                    userStatusId: userStatusId,
                    updatedAt: response.UpdatedAt || response.updatedAt
                  }
                  : u
              )
            );

            console.log(`[Unban] Updated local state: status=${status}, userStatusId=${userStatusId}`);
            break; // Success, exit retry loop
          }
        } catch (fetchError) {
          console.error(`[Unban] Error fetching updated user data (attempt ${retries + 1}):`, fetchError);
          if (retries < maxRetries - 1) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // If still no response after retries, use fallback
      if (!updatedUserResponse) {
        console.warn(`[Unban] Failed to fetch updated user data after ${maxRetries} attempts. Using fallback: NORMAL`);
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === selectedUserForUnban.id
              ? { ...u, status: 'NORMAL', userStatusId: USER_STATUS.NORMAL }
              : u
          )
        );
      }

      // Set timestamp to notify UserDetail to refresh
      localStorage.setItem(`${STORAGE_KEYS.USER_UPDATED_TIMESTAMP}_${selectedUserForUnban.id}`, Date.now().toString());
      console.log(`[Unban] Set refresh timestamp for UserDetail`);

      alert('Đã gỡ ban người dùng thành công!');
      handleCloseUnbanModal();
    } catch (error) {
      console.error('[Unban] Error unbanning user:', error);
      alert('Không thể gỡ ban người dùng. Vui lòng thử lại sau.');
    }
  };

  // UserStatusId mapping
  // From database: 1 = "Bị khóa" (BANNED), 2 = "Tài khoản thường" (NORMAL), 3 = "Tài khoản VIP" (PREMIUM)
  const USER_STATUS = {
    BANNED: 1,
    NORMAL: 2,
    PREMIUM: 3
  };

  // Fetch pets count for users
  const fetchPetsCount = React.useCallback(async (usersList) => {
    try {
      // Fetch pets for each user (in parallel, but limit to avoid too many requests)
      const petPromises = usersList.slice(0, 20).map(user => {
        const userId = user.id;
        return petService.getPetsByUser(userId)
          .then(response => {
            return { userId, count: Array.isArray(response) ? response.length : 0 };
          })
          .catch(() => ({ userId, count: 0 }));
      });

      const petCounts = await Promise.all(petPromises);
      const petsCountMap = {};
      petCounts.forEach(({ userId, count }) => {
        petsCountMap[userId] = count;
      });

      // Update cache
      userPetsCountRef.current = { ...userPetsCountRef.current, ...petsCountMap };

      // Update users with pets count
      setUsers(prevUsers =>
        prevUsers.map(user => ({
          ...user,
          totalPets: petsCountMap[user.id] || user.totalPets || 0
        }))
      );
    } catch (err) {
      console.error('Error fetching pets count:', err);
    }
  }, []);

  // Fetch users from API (chỉ fetch một lần khi mount, filter phía frontend)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prepare query parameters - luôn lấy full list, không filter ở backend
        const params = {
          page: 1,
          pageSize: 1000,
          includeDeleted: false
        };

        const response = await userService.getUsers(params);

        // Backend returns: { Items: UserResponse[], Total: number, Page: number, PageSize: number }
        const usersData = response.Items || response.items || [];

        // Map backend UserResponse to frontend user format
        const mappedUsers = usersData.map(user => {
          // Map UserStatusId to status string
          // Convert to number to handle both string and number from backend
          const userStatusId = parseInt(user.UserStatusId || user.userStatusId) || 2; // Default to NORMAL (2)
          let status = 'NORMAL';
          if (userStatusId === USER_STATUS.PREMIUM) {
            status = 'PREMIUM';
          } else if (userStatusId === USER_STATUS.BANNED) {
            status = 'BANNED';
          }

          // Split FullName into firstName and lastName
          const fullName = user.FullName || user.fullName || user.Email?.split('@')[0] || 'User';
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || fullName;
          const lastName = nameParts.slice(1).join(' ') || '';

          const mappedUser = {
            id: user.UserId || user.userId,
            username: user.Email?.split('@')[0] || 'user',
            email: user.Email || user.email,
            firstName,
            lastName,
            fullName,
            status,
            roleId: user.RoleId || user.roleId,
            userStatusId: userStatusId, // Use parsed value
            gender: user.Gender || user.gender,
            isVerified: user.isProfileComplete || user.IsProfileComplete || false,
            avatar: null, // Backend doesn't have avatar
            phone: null, // Backend doesn't have phone
            address: null, // Backend doesn't have address (only AddressId)
            dateOfBirth: null, // Backend doesn't have dateOfBirth
            createdAt: user.CreatedAt || user.createdAt,
            updatedAt: user.UpdatedAt || user.updatedAt,
            lastLogin: null, // Backend doesn't have lastLogin
            totalPets: 0 // Will be updated after fetching pets count
          };

          // Debug: log users with PREMIUM or BANNED status
          if (mappedUser.userStatusId === USER_STATUS.PREMIUM) {
            console.log('Found PREMIUM user:', {
              id: mappedUser.id,
              name: mappedUser.fullName,
              userStatusId: mappedUser.userStatusId,
              status: mappedUser.status,
              originalUserStatusId: user.UserStatusId || user.userStatusId,
              originalType: typeof (user.UserStatusId || user.userStatusId)
            });
          }
          if (mappedUser.userStatusId === USER_STATUS.BANNED || mappedUser.status === 'BANNED') {
            console.log('Found BANNED user:', mappedUser);
          }

          return mappedUser;
        });

        // Filter chỉ lấy role "Người dùng" (User, RoleId = 3) - không hiển thị Admin và Expert
        const userRoleOnly = mappedUsers.filter(user => user.roleId === ROLE_ID.USER);

        // Sắp xếp theo ngày tạo (mới nhất -> cũ nhất)
        const sortedUsers = userRoleOnly.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        setUsers(sortedUsers);

        // Fetch pets count for each user (in parallel, but limit concurrency)
        fetchPetsCount(sortedUsers);

      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Chỉ fetch một lần khi mount

  // Fetch user stats (total, normal, premium, verified)
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch all users without pagination to get stats
        const response = await userService.getUsers({
          page: 1,
          pageSize: 1000, // Get all users for stats
          includeDeleted: false
        });

        const allUsers = response.Items || response.items || [];

        // Filter chỉ lấy role "Người dùng" (User, RoleId = 3) - không tính Admin và Expert
        const userRoleOnly = allUsers.filter(u => (u.RoleId || u.roleId) === ROLE_ID.USER);

        const stats = {
          total: userRoleOnly.length,
          normal: userRoleOnly.filter(u => (u.UserStatusId || u.userStatusId) === USER_STATUS.NORMAL).length,
          premium: userRoleOnly.filter(u => (u.UserStatusId || u.userStatusId) === USER_STATUS.PREMIUM).length,
          verified: userRoleOnly.filter(u => u.isProfileComplete || u.IsProfileComplete).length
        };

        setUserStats(stats);
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }
    };

    fetchUserStats();
  }, [USER_STATUS.NORMAL, USER_STATUS.PREMIUM]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Memoize filtered users to avoid recalculating on every render (giống PetsList)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filter by search term
      const matchesSearch =
        (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'NORMAL' && user.status === 'NORMAL') ||
        (filterStatus === 'PREMIUM' && user.status === 'PREMIUM') ||
        (filterStatus === 'BANNED' && user.status === 'BANNED');

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, filterStatus]);

  // Sắp xếp filtered users theo ngày tạo (mới nhất -> cũ nhất)
  const sortedUsersForView = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredUsers]);

  // Update total pages when filtered users change
  useEffect(() => {
    const total = sortedUsersForView.length;
    setTotalPages(Math.ceil(total / itemsPerPage));
  }, [sortedUsersForView, itemsPerPage]);

  // Memoize current users (paginated)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedUsersForView.slice(startIndex, endIndex);
  }, [sortedUsersForView, currentPage, itemsPerPage]);

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (user) => {
    // Check if user is banned (from localStorage or userStatusId)
    const isBanned = isUserBanned(user.id) || user.userStatusId === USER_STATUS.BANNED;

    if (isBanned) {
      return (
        <span
          className="status-badge banned"
          style={{ backgroundColor: '#e74c3c' }}
        >
          BANNED
        </span>
      );
    }

    const statusConfig = {
      NORMAL: { color: '#3498db', text: 'NORMAL' },
      PREMIUM: { color: '#f39c12', text: 'PREMIUM' }
    };

    const config = statusConfig[user.status] || { color: '#95a5a6', text: 'NORMAL' };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="users-page">
        <div className="page-header">
          <h1>Quản lý người dùng</h1>
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
      <div className="users-page">
        <div className="page-header">
          <h1>Quản lý người dùng</h1>
          <p style={{ color: '#e74c3c' }}>{error}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        <p>Danh sách tất cả người dùng trong hệ thống</p>
      </div>

      <div className="users-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="NORMAL">NORMAL</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <span className="stat-number">{userStats.total}</span>
          <span className="stat-label">Tổng người dùng</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{userStats.normal}</span>
          <span className="stat-label">NORMAL</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{userStats.premium}</span>
          <span className="stat-label">PREMIUM</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{userStats.verified}</span>
          <span className="stat-label">Đã xác thực</span>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Thông tin cá nhân</th>
              <th>Liên hệ</th>
              <th>Trạng thái</th>
              <th>Thống kê</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{user.firstName} {user.lastName}</div>
                      {user.gender && (
                        <div className="user-details">
                          {user.gender}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div className="contact-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="contact-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {user.phone}
                        </div>
                      )}
                      {user.address && (
                        <div className="contact-item address">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {user.address}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(user)}
                  </td>
                  <td>
                    {user.roleId === ROLE_ID.EXPERT ? (
                      <div className="user-stats placeholder">
                        <span className="stat-label">Không áp dụng cho Expert</span>
                      </div>
                    ) : (
                      <div className="user-stats">
                        <div className="stat-item">
                          <span className="stat-label">Thú cưng:</span>
                          <span className="stat-value">{user.totalPets}</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {user.createdAt ? (
                      <div className="date-info">
                        <div>{formatDate(user.createdAt)}</div>
                        <div className="time-info">{new Date(user.createdAt).toLocaleTimeString('vi-VN')}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>N/A</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        style={{ width: '18px', minWidth: '18px', height: '28px', padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(user.id);
                        }}
                        title="Xem chi tiết người dùng"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="action-btn edit"
                        style={{ width: '18px', minWidth: '18px', height: '28px', padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBanModal(user);
                        }}
                        title="Xử lý sai phạm"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {/* Unban button - chỉ hiển thị khi user bị banned */}
                      {(() => {
                        const isBanned = isUserBanned(user.id) || user.userStatusId === USER_STATUS.BANNED;
                        return isBanned;
                      })() && (
                          <button
                            className="action-btn unban"
                            style={{ width: '18px', minWidth: '18px', height: '28px', padding: 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUnbanModal(user);
                            }}
                            title="Gỡ ban người dùng"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>
                              <path d="M9 12l2 2 4-4" />
                              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                            </svg>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Không tìm thấy người dùng nào
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
              <path d="M15 18l-6-6 6-6" />
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
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && selectedUser && createPortal(
        <div className="modal-overlay" onClick={handleCloseBanModal}>
          <div className="modal-content ban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xử lý sai phạm - {selectedUser.firstName} {selectedUser.lastName}</h2>
              <button className="modal-close" onClick={handleCloseBanModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Current ban status */}
              {isUserBanned(selectedUser.id) && (
                <div className="ban-status-info">
                  <h3>Trạng thái ban hiện tại:</h3>
                  <div className="ban-info-item">
                    <span className="ban-label">Lý do ban:</span>
                    <span className="ban-value">{getBanInfo(selectedUser.id).reason}</span>
                  </div>
                  <div className="ban-info-item">
                    <span className="ban-label">Thời gian còn lại:</span>
                    <span className="ban-value time-remaining">
                      {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : 'Vĩnh viễn'}
                    </span>
                  </div>
                  {getBanInfo(selectedUser.id).banExpiresAt && (
                    <div className="ban-info-item">
                      <span className="ban-label">Hết hạn vào:</span>
                      <span className="ban-value">
                        {(() => {
                          // Use the stored banExpiresAt, don't recalculate
                          const banExpiresAt = getBanInfo(selectedUser.id).banExpiresAt;
                          return new Date(banExpiresAt).toLocaleString('vi-VN');
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Ban form */}
              <div className="ban-form">
                <h3>{isUserBanned(selectedUser.id) ? 'Cập nhật ban' : 'Ban người dùng'}</h3>

                <div className="form-group">
                  <label htmlFor="banDuration">Thời gian ban:</label>
                  <select
                    id="banDuration"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="form-select"
                  >
                    <option value="1">1 ngày</option>
                    <option value="3">3 ngày</option>
                    <option value="7">7 ngày</option>
                    <option value="30">1 tháng</option>
                    <option value="90">3 tháng</option>
                    <option value="permanent">Vĩnh viễn</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="banReason">Lý do ban: <span className="required">*</span></label>
                  <textarea
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Nhập lý do ban người dùng..."
                    rows="4"
                    className="form-textarea"
                    required
                  />
                </div>

                {/* Preview ban expiration - only show for new bans, not existing ones */}
                {!isUserBanned(selectedUser.id) && banDuration !== 'permanent' && (
                  <div className="ban-preview">
                    <span className="ban-preview-label">Thời gian ban sẽ hết hạn vào:</span>
                    <span className="ban-preview-value">
                      {(() => {
                        const now = Date.now();
                        const days = parseInt(banDuration);
                        const expiresAt = now + (days * 24 * 60 * 60 * 1000);
                        return new Date(expiresAt).toLocaleString('vi-VN');
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseBanModal}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleBanUser}>
                {isUserBanned(selectedUser.id) ? 'Cập nhật ban' : 'Xác nhận ban'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Unban User Modal */}
      {showUnbanModal && selectedUserForUnban && createPortal(
        <div className="modal-overlay" onClick={handleCloseUnbanModal}>
          <div className="modal-content unban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gỡ ban người dùng - {selectedUserForUnban.firstName} {selectedUserForUnban.lastName}</h2>
              <button className="modal-close" onClick={handleCloseUnbanModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Ban information */}
              {isUserBanned(selectedUserForUnban.id) && (
                <div className="ban-status-info">
                  <h3>Thông tin ban hiện tại:</h3>
                  <div className="ban-info-item">
                    <span className="ban-label">Lý do ban:</span>
                    <span className="ban-value">{getBanInfo(selectedUserForUnban.id)?.reason || 'Không có thông tin'}</span>
                  </div>
                  <div className="ban-info-item">
                    <span className="ban-label">Thời gian ban còn lại:</span>
                    <span className="ban-value time-remaining" style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {(() => {
                        const ban = getBanInfo(selectedUserForUnban.id);
                        if (!ban) return 'Không có thông tin';
                        if (!ban.banExpiresAt) return 'Vĩnh viễn';
                        // Use unbanTimeRemaining if available (real-time countdown), otherwise calculate
                        const remaining = unbanTimeRemaining !== null ? unbanTimeRemaining : (ban.banExpiresAt - Date.now());
                        if (remaining <= 0) return 'Đã hết hạn';
                        return formatTimeRemaining(remaining);
                      })()}
                    </span>
                  </div>
                  {getBanInfo(selectedUserForUnban.id)?.banExpiresAt && (
                    <div className="ban-info-item">
                      <span className="ban-label">Hết hạn vào:</span>
                      <span className="ban-value">
                        {new Date(getBanInfo(selectedUserForUnban.id).banExpiresAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                  {getBanInfo(selectedUserForUnban.id)?.bannedAt && (
                    <div className="ban-info-item">
                      <span className="ban-label">Bị ban từ:</span>
                      <span className="ban-value">
                        {new Date(getBanInfo(selectedUserForUnban.id).bannedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!isUserBanned(selectedUserForUnban.id) && selectedUserForUnban.userStatusId === USER_STATUS.BANNED && (
                <div className="ban-status-info">
                  <h3>Thông tin ban:</h3>
                  <div className="ban-info-item">
                    <span className="ban-label">Trạng thái:</span>
                    <span className="ban-value" style={{ color: '#e74c3c', fontWeight: 'bold' }}>BANNED</span>
                  </div>
                  <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '1rem' }}>
                    Người dùng này đang bị ban. Bạn có muốn gỡ ban không?
                  </p>
                </div>
              )}

              <div className="unban-warning" style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(231, 76, 60, 0.3)'
              }}>
                <p style={{ color: '#e74c3c', margin: 0, fontWeight: '500' }}>
                  ⚠️ Bạn có chắc chắn muốn gỡ ban cho người dùng này không?
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseUnbanModal}>
                Hủy
              </button>
              <button className="btn btn-success" onClick={handleUnbanUserDirect} style={{ backgroundColor: '#27ae60', borderColor: '#27ae60' }}>
                Xác nhận gỡ ban
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UsersList;