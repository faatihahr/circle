import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../stores/userSlice';
import type { UserState } from '../stores/userSlice';

// export const useFetchProfile = () => {
//   const dispatch = useDispatch();
//   const { profile, loading, error } = useSelector((state: { user: UserState }) => state.user);

//   useEffect(() => {
//     if (!profile) {
//       dispatch(getProfile() as any);
//     }
//   }, [dispatch, profile]);

//   return { profile, loading, error, refetch: () => dispatch(getProfile() as any) };
// };
