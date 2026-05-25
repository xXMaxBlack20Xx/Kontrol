import { apiRequest } from '@/features/api/api';

export type ApiUser = {
  userId: string;
  email: string;
  displayName: string | null;
  profilePhotoId: string | null;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
};

export type RefreshResponse = {
  accessToken: string;
};

export async function registerWithApi(input: { email: string; password: string }): Promise<AuthTokensResponse> {
  return apiRequest<AuthTokensResponse>('/auth/register', {
    auth: false,
    body: input,
    method: 'POST',
  });
}

export async function loginWithApi(input: { email: string; password: string }): Promise<AuthTokensResponse> {
  return apiRequest<AuthTokensResponse>('/auth/login', {
    auth: false,
    body: input,
    method: 'POST',
  });
}

export async function refreshWithApi(refreshToken: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    auth: false,
    body: { refreshToken },
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function logoutWithApi(refreshToken: string): Promise<void> {
  await apiRequest<{ success: boolean }>('/auth/logout', {
    auth: false,
    body: { refreshToken },
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function getMeWithApi(): Promise<ApiUser> {
  const response = await apiRequest<{ user: ApiUser }>('/me');

  return response.user;
}
