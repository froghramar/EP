import Router from '@koa/router';
import { executeTool } from '../../services/agentTools';

const router = new Router();

// List WordPress posts
router.get('/api/wordpress/posts', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.status) params.status = ctx.query.status;
    if (ctx.query.search) params.search = ctx.query.search;
    if (ctx.query.author) params.author = Number(ctx.query.author);

    const result = await executeTool('wp_list_posts', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific post
router.get('/api/wordpress/posts/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const result = await executeTool('wp_get_post', { id });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Create a new post
router.post('/api/wordpress/posts', async (ctx) => {
  try {
    const result = await executeTool('wp_create_post', ctx.request.body);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.status = 201;
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update a post
router.put('/api/wordpress/posts/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const data = { id, ...(ctx.request.body as any) };
    const result = await executeTool('wp_update_post', data);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Delete a post
router.delete('/api/wordpress/posts/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const force = ctx.query.force === 'true';
    const result = await executeTool('wp_delete_post', { id, force });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// List WordPress pages
router.get('/api/wordpress/pages', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.status) params.status = ctx.query.status;
    if (ctx.query.search) params.search = ctx.query.search;

    const result = await executeTool('wp_list_pages', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific page
router.get('/api/wordpress/pages/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const result = await executeTool('wp_get_page', { id });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Create a new page
router.post('/api/wordpress/pages', async (ctx) => {
  try {
    const result = await executeTool('wp_create_page', ctx.request.body);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.status = 201;
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update a page
router.put('/api/wordpress/pages/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const data = { id, ...(ctx.request.body as any) };
    const result = await executeTool('wp_update_page', data);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Delete a page
router.delete('/api/wordpress/pages/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const force = ctx.query.force === 'true';
    const result = await executeTool('wp_delete_page', { id, force });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// List categories
router.get('/api/wordpress/categories', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.search) params.search = ctx.query.search;
    if (ctx.query.hide_empty !== undefined) params.hide_empty = ctx.query.hide_empty === 'true';

    const result = await executeTool('wp_list_categories', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Create a category
router.post('/api/wordpress/categories', async (ctx) => {
  try {
    const result = await executeTool('wp_create_category', ctx.request.body);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.status = 201;
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// List tags
router.get('/api/wordpress/tags', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.search) params.search = ctx.query.search;
    if (ctx.query.hide_empty !== undefined) params.hide_empty = ctx.query.hide_empty === 'true';

    const result = await executeTool('wp_list_tags', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific category
router.get('/api/wordpress/categories/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const result = await executeTool('wp_get_category', { id });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update a category
router.put('/api/wordpress/categories/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const data = { id, ...(ctx.request.body as any) };
    const result = await executeTool('wp_update_category', data);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Delete a category
router.delete('/api/wordpress/categories/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const force = ctx.query.force === 'true';
    const result = await executeTool('wp_delete_category', { id, force });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Create a tag
router.post('/api/wordpress/tags', async (ctx) => {
  try {
    const result = await executeTool('wp_create_tag', ctx.request.body);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.status = 201;
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific tag
router.get('/api/wordpress/tags/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const result = await executeTool('wp_get_tag', { id });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update a tag
router.put('/api/wordpress/tags/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const data = { id, ...(ctx.request.body as any) };
    const result = await executeTool('wp_update_tag', data);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Delete a tag
router.delete('/api/wordpress/tags/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const force = ctx.query.force === 'true';
    const result = await executeTool('wp_delete_tag', { id, force });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// List media
router.get('/api/wordpress/media', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.media_type) params.media_type = ctx.query.media_type;
    if (ctx.query.search) params.search = ctx.query.search;

    const result = await executeTool('wp_list_media', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific media item
router.get('/api/wordpress/media/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const result = await executeTool('wp_get_media', { id });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update a media item
router.put('/api/wordpress/media/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const data = { id, ...(ctx.request.body as any) };
    const result = await executeTool('wp_update_media', data);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Delete a media item
router.delete('/api/wordpress/media/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const force = ctx.query.force === 'true';
    const result = await executeTool('wp_delete_media', { id, force });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// List comments
router.get('/api/wordpress/comments', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.post) params.post = Number(ctx.query.post);
    if (ctx.query.status) params.status = ctx.query.status;

    const result = await executeTool('wp_list_comments', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific comment
router.get('/api/wordpress/comments/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const result = await executeTool('wp_get_comment', { id });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Create a comment
router.post('/api/wordpress/comments', async (ctx) => {
  try {
    const result = await executeTool('wp_create_comment', ctx.request.body);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.status = 201;
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update a comment
router.put('/api/wordpress/comments/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const data = { id, ...(ctx.request.body as any) };
    const result = await executeTool('wp_update_comment', data);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Delete a comment
router.delete('/api/wordpress/comments/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const force = ctx.query.force === 'true';
    const result = await executeTool('wp_delete_comment', { id, force });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// List users
router.get('/api/wordpress/users', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.search) params.search = ctx.query.search;
    if (ctx.query.roles) {
      params.roles = Array.isArray(ctx.query.roles) 
        ? ctx.query.roles 
        : [ctx.query.roles];
    }

    const result = await executeTool('wp_list_users', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific user
router.get('/api/wordpress/users/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const result = await executeTool('wp_get_user', { id });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Create a user
router.post('/api/wordpress/users', async (ctx) => {
  try {
    const result = await executeTool('wp_create_user', ctx.request.body);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.status = 201;
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update a user
router.put('/api/wordpress/users/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const data = { id, ...(ctx.request.body as any) };
    const result = await executeTool('wp_update_user', data);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Delete a user
router.delete('/api/wordpress/users/:id', async (ctx) => {
  try {
    const id = Number(ctx.params.id);
    const force = ctx.query.force === 'true';
    const reassign = ctx.query.reassign ? Number(ctx.query.reassign) : undefined;
    const result = await executeTool('wp_delete_user', { id, force, reassign });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get settings
router.get('/api/wordpress/settings', async (ctx) => {
  try {
    const result = await executeTool('wp_get_settings', {});
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Update settings
router.put('/api/wordpress/settings', async (ctx) => {
  try {
    const result = await executeTool('wp_update_settings', ctx.request.body);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 400;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Search
router.get('/api/wordpress/search', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.search) params.search = ctx.query.search;
    if (ctx.query.per_page) params.per_page = Number(ctx.query.per_page);
    if (ctx.query.page) params.page = Number(ctx.query.page);
    if (ctx.query.type) params.type = ctx.query.type;
    if (ctx.query.subtype) params.subtype = ctx.query.subtype;

    const result = await executeTool('wp_search', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// List taxonomies
router.get('/api/wordpress/taxonomies', async (ctx) => {
  try {
    const params: any = {};
    if (ctx.query.type) params.type = ctx.query.type;

    const result = await executeTool('wp_list_taxonomies', params);
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 500;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get a specific taxonomy
router.get('/api/wordpress/taxonomies/:taxonomy', async (ctx) => {
  try {
    const taxonomy = ctx.params.taxonomy;
    const result = await executeTool('wp_get_taxonomy', { taxonomy });
    const response = JSON.parse(result);

    if (response.error) {
      ctx.status = response.status || 404;
      ctx.body = response;
    } else {
      ctx.body = response;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;
