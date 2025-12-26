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

export default router;
