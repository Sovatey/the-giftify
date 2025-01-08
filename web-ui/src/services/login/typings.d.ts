declare namespace API {
  type ApiResponse = {
    code?: number;
    type?: string;
    message?: string;
  };

  type accessLevel = {
    user?: string;
    requist?: string;
    resume?: string;
  };

  type CurrentUser = {
    id?: number;
    emp_id: number;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    is_hr: number;

    access: string;

    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    expiry?: Moment;
    token?: string;
    status?: string;
    type?: string;
    currentAuthority?: string;
    detail?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
    token?: string;
  };
  type LoginItem = {
    username?: string;
    password?: string;
  };
}
