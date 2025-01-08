// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

function authenticateUser(user: string, password: string) {
  var token = user + ':' + password;

  var hash = Buffer.from(token).toString('base64');
  return 'Basic ' + hash;
}

export async function currentUser(
  token: string,
  options?: { [key: string]: any },
) {
  return request<{ data: API.CurrentUser }>(`/api/user/current-user/`, {
    method: 'GET',
    ...(options || {}),
  });
}

export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/auth/logout/', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function login(
  body: API.LoginParams,
  options?: { [key: string]: any },
) {
  return request<API.LoginResult>('/api/user/login/', {
    method: 'POST',
    credentials: 'include',
    data: {
      username: body.username,
      password: body.password,
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(options || {}),
  });
}

export async function currentPermission(group_id: string) {
  return request<API.CurrentUserPermission>(
    `/api/user/permission/${group_id}/`,
    {
      method: 'GET',
    },
  );
}
