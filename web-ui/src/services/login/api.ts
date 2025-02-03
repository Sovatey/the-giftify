import apiClient from "../../../config/config";

export const getUserProfile = async () => {
  const response = await apiClient.get("/user/current-user/");
  return response.data;
};

export const loginUser = async (unsername: string, password: string) => {
  const response = await apiClient.post("/user/login/", {
    unsername,
    password,
  });
  return response.data;
};
