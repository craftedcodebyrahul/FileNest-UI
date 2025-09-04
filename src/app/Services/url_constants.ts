import { get } from "node:http";

export const url_constants = {
  auth: {
    login: 'auth/login',
    register: 'auth/signup',
    logout: 'auth/logout',
    get_profile: 'auth/get_profile',
    update_profile: 'auth/update_profile',
    change_password: 'auth/change_password',
    forgot_password: 'auth/forgot_password',
    reset_password: 'auth/reset_password',
  },
  file: {
    upload: 'file/upload',
    get_all_files: 'file/files',
    create_directory: 'file/create_directory',
    delete_file: 'file/delete_file',
    delete_dir: 'file/delete_dir',
    get_signed_url: 'file/get_signed_url',
    rename_dir: 'file/rename_dir',
    rename_file: 'file/rename_file',
  },
};
