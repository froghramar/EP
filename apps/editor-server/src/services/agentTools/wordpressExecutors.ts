import axios, { AxiosError } from 'axios';
import { WORDPRESS_API_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD } from '../../config';

/**
 * Execute WordPress REST API tool
 */
export async function executeWordpressTool(toolName: string, toolInput: any): Promise<string> {
  try {
    switch (toolName) {
      // List operations
      case 'wp_list_posts':
      case 'wp_list_pages':
      case 'wp_list_media':
      case 'wp_list_categories':
      case 'wp_list_tags':
      case 'wp_list_comments':
      case 'wp_list_users': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        const endpointMap: Record<string, string> = {
          wp_list_posts: '/wp/v2/posts',
          wp_list_pages: '/wp/v2/pages',
          wp_list_media: '/wp/v2/media',
          wp_list_categories: '/wp/v2/categories',
          wp_list_tags: '/wp/v2/tags',
          wp_list_comments: '/wp/v2/comments',
          wp_list_users: '/wp/v2/users',
        };

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}`,
            params: toolInput,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data, total: response.headers['x-wp-total'], totalPages: response.headers['x-wp-totalpages'] });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Get single resource operations
      case 'wp_get_post':
      case 'wp_get_page':
      case 'wp_get_media': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        const endpointMap: Record<string, string> = {
          wp_get_post: '/wp/v2/posts',
          wp_get_page: '/wp/v2/pages',
          wp_get_media: '/wp/v2/media',
        };

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${toolInput.id}`,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Create operations
      case 'wp_create_post':
      case 'wp_create_page':
      case 'wp_create_category':
      case 'wp_create_tag':
      case 'wp_create_comment': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for creating content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_create_post: '/wp/v2/posts',
          wp_create_page: '/wp/v2/pages',
          wp_create_category: '/wp/v2/categories',
          wp_create_tag: '/wp/v2/tags',
          wp_create_comment: '/wp/v2/comments',
        };

        try {
          const response = await axios({
            method: 'POST',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}`,
            data: toolInput,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Created successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Update operations
      case 'wp_update_post':
      case 'wp_update_page': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for updating content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_update_post: '/wp/v2/posts',
          wp_update_page: '/wp/v2/pages',
        };

        const { id, ...updateData } = toolInput;

        try {
          const response = await axios({
            method: 'PUT',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${id}`,
            data: updateData,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Updated successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Delete operations
      case 'wp_delete_post':
      case 'wp_delete_page': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for deleting content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_delete_post: '/wp/v2/posts',
          wp_delete_page: '/wp/v2/pages',
        };

        try {
          const params: any = {};
          if (toolInput.force) {
            params.force = true;
          }

          const response = await axios({
            method: 'DELETE',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${toolInput.id}`,
            params,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Deleted successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Get category, tag, comment, user
      case 'wp_get_category':
      case 'wp_get_tag':
      case 'wp_get_comment':
      case 'wp_get_user': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        const endpointMap: Record<string, string> = {
          wp_get_category: '/wp/v2/categories',
          wp_get_tag: '/wp/v2/tags',
          wp_get_comment: '/wp/v2/comments',
          wp_get_user: '/wp/v2/users',
        };

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${toolInput.id}`,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Create user
      case 'wp_create_user': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for creating users. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        try {
          const response = await axios({
            method: 'POST',
            url: `${WORDPRESS_API_URL}/wp/v2/users`,
            data: toolInput,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'User created successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Update category, tag, comment, user, media
      case 'wp_update_category':
      case 'wp_update_tag':
      case 'wp_update_comment':
      case 'wp_update_user':
      case 'wp_update_media': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for updating content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_update_category: '/wp/v2/categories',
          wp_update_tag: '/wp/v2/tags',
          wp_update_comment: '/wp/v2/comments',
          wp_update_user: '/wp/v2/users',
          wp_update_media: '/wp/v2/media',
        };

        const { id, ...updateData } = toolInput;

        try {
          const response = await axios({
            method: 'PUT',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${id}`,
            data: updateData,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Updated successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Delete category, tag, comment, user, media
      case 'wp_delete_category':
      case 'wp_delete_tag':
      case 'wp_delete_comment':
      case 'wp_delete_user':
      case 'wp_delete_media': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for deleting content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_delete_category: '/wp/v2/categories',
          wp_delete_tag: '/wp/v2/tags',
          wp_delete_comment: '/wp/v2/comments',
          wp_delete_user: '/wp/v2/users',
          wp_delete_media: '/wp/v2/media',
        };

        try {
          const params: any = {};
          if (toolInput.force) {
            params.force = true;
          }
          if (toolInput.reassign) {
            params.reassign = toolInput.reassign;
          }

          const response = await axios({
            method: 'DELETE',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${toolInput.id}`,
            params,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Deleted successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Settings
      case 'wp_get_settings': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for accessing settings. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        try {
          const response = await axios({
            method: 'GET',
            url: `${WORDPRESS_API_URL}/wp/v2/settings`,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_update_settings': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for updating settings. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        try {
          const response = await axios({
            method: 'PUT',
            url: `${WORDPRESS_API_URL}/wp/v2/settings`,
            data: toolInput,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Settings updated successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Search
      case 'wp_search': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}/wp/v2/search`,
            params: toolInput,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data, total: response.headers['x-wp-total'], totalPages: response.headers['x-wp-totalpages'] });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Taxonomies
      case 'wp_list_taxonomies': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}/wp/v2/taxonomies`,
            params: toolInput,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_get_taxonomy': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}/wp/v2/taxonomies/${toolInput.taxonomy}`,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_list_plugins': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}/wp/v2/plugins`,
            params: toolInput,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_get_plugin': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}/wp/v2/plugins/${encodeURIComponent(toolInput.plugin)}`,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_create_plugin': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const config: any = {
            method: 'POST',
            url: `${WORDPRESS_API_URL}/wp/v2/plugins`,
            data: toolInput,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_update_plugin': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const { plugin, ...data } = toolInput;
          const config: any = {
            method: 'PUT',
            url: `${WORDPRESS_API_URL}/wp/v2/plugins/${encodeURIComponent(plugin)}`,
            data: data,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_delete_plugin': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        try {
          const config: any = {
            method: 'DELETE',
            url: `${WORDPRESS_API_URL}/wp/v2/plugins/${encodeURIComponent(toolInput.plugin)}`,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown WordPress tool: ${toolName}` });
    }
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
