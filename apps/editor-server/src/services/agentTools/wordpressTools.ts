import Anthropic from '@anthropic-ai/sdk';

/**
 * WordPress REST API tool definitions
 */
export const wordpressTools: Anthropic.Tool[] = [
  {
    name: 'wp_list_posts',
    description: 'List WordPress posts with optional filtering. Returns an array of posts.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of posts per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        status: {
          type: 'string',
          description: 'Filter by post status',
          enum: ['publish', 'draft', 'pending', 'private', 'future'],
        },
        search: {
          type: 'string',
          description: 'Search posts by keyword',
        },
        author: {
          type: 'number',
          description: 'Filter by author ID',
        },
      },
    },
  },
  {
    name: 'wp_get_post',
    description: 'Get a specific WordPress post by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The post ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_create_post',
    description: 'Create a new WordPress post.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The post title',
        },
        content: {
          type: 'string',
          description: 'The post content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Post status (default: draft)',
          enum: ['publish', 'draft', 'pending', 'private', 'future'],
        },
        excerpt: {
          type: 'string',
          description: 'The post excerpt',
        },
        categories: {
          type: 'array',
          description: 'Array of category IDs',
          items: { type: 'number' },
        },
        tags: {
          type: 'array',
          description: 'Array of tag IDs',
          items: { type: 'number' },
        },
        featured_media: {
          type: 'number',
          description: 'Featured media ID',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'wp_update_post',
    description: 'Update an existing WordPress post.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The post ID to update',
        },
        title: {
          type: 'string',
          description: 'The post title',
        },
        content: {
          type: 'string',
          description: 'The post content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Post status',
          enum: ['publish', 'draft', 'pending', 'private', 'future'],
        },
        excerpt: {
          type: 'string',
          description: 'The post excerpt',
        },
        categories: {
          type: 'array',
          description: 'Array of category IDs',
          items: { type: 'number' },
        },
        tags: {
          type: 'array',
          description: 'Array of tag IDs',
          items: { type: 'number' },
        },
        featured_media: {
          type: 'number',
          description: 'Featured media ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_post',
    description: 'Delete a WordPress post by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The post ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_list_pages',
    description: 'List WordPress pages with optional filtering.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of pages per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        status: {
          type: 'string',
          description: 'Filter by page status',
          enum: ['publish', 'draft', 'pending', 'private'],
        },
        search: {
          type: 'string',
          description: 'Search pages by keyword',
        },
      },
    },
  },
  {
    name: 'wp_get_page',
    description: 'Get a specific WordPress page by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The page ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_create_page',
    description: 'Create a new WordPress page.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The page title',
        },
        content: {
          type: 'string',
          description: 'The page content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Page status (default: draft)',
          enum: ['publish', 'draft', 'pending', 'private'],
        },
        parent: {
          type: 'number',
          description: 'Parent page ID',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'wp_update_page',
    description: 'Update an existing WordPress page.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The page ID to update',
        },
        title: {
          type: 'string',
          description: 'The page title',
        },
        content: {
          type: 'string',
          description: 'The page content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Page status',
          enum: ['publish', 'draft', 'pending', 'private'],
        },
        parent: {
          type: 'number',
          description: 'Parent page ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_page',
    description: 'Delete a WordPress page by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The page ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_list_media',
    description: 'List WordPress media items.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of items per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        media_type: {
          type: 'string',
          description: 'Filter by media type',
          enum: ['image', 'video', 'audio', 'application'],
        },
        search: {
          type: 'string',
          description: 'Search media by keyword',
        },
      },
    },
  },
  {
    name: 'wp_get_media',
    description: 'Get a specific WordPress media item by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The media ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_list_categories',
    description: 'List WordPress categories.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of categories per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        search: {
          type: 'string',
          description: 'Search categories by keyword',
        },
        hide_empty: {
          type: 'boolean',
          description: 'Whether to hide categories with no posts (default: false)',
        },
      },
    },
  },
  {
    name: 'wp_create_category',
    description: 'Create a new WordPress category.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The category name',
        },
        description: {
          type: 'string',
          description: 'The category description',
        },
        parent: {
          type: 'number',
          description: 'Parent category ID',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'wp_list_tags',
    description: 'List WordPress tags.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of tags per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        search: {
          type: 'string',
          description: 'Search tags by keyword',
        },
        hide_empty: {
          type: 'boolean',
          description: 'Whether to hide tags with no posts (default: false)',
        },
      },
    },
  },
  {
    name: 'wp_create_tag',
    description: 'Create a new WordPress tag.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The tag name',
        },
        description: {
          type: 'string',
          description: 'The tag description',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'wp_list_comments',
    description: 'List WordPress comments.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of comments per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        post: {
          type: 'number',
          description: 'Filter by post ID',
        },
        status: {
          type: 'string',
          description: 'Filter by comment status',
          enum: ['approved', 'hold', 'spam', 'trash'],
        },
      },
    },
  },
  {
    name: 'wp_create_comment',
    description: 'Create a new WordPress comment.',
    input_schema: {
      type: 'object',
      properties: {
        post: {
          type: 'number',
          description: 'The post ID to comment on',
        },
        content: {
          type: 'string',
          description: 'The comment content',
        },
        author_name: {
          type: 'string',
          description: 'Comment author name',
        },
        author_email: {
          type: 'string',
          description: 'Comment author email',
        },
      },
      required: ['post', 'content'],
    },
  },
  {
    name: 'wp_list_users',
    description: 'List WordPress users.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of users per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        search: {
          type: 'string',
          description: 'Search users by keyword',
        },
        roles: {
          type: 'array',
          description: 'Filter by user roles',
          items: { type: 'string' },
        },
      },
    },
  },
  {
    name: 'wp_get_category',
    description: 'Get a specific WordPress category by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The category ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_update_category',
    description: 'Update an existing WordPress category.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The category ID to update',
        },
        name: {
          type: 'string',
          description: 'The category name',
        },
        description: {
          type: 'string',
          description: 'The category description',
        },
        parent: {
          type: 'number',
          description: 'Parent category ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_category',
    description: 'Delete a WordPress category by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The category ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_get_tag',
    description: 'Get a specific WordPress tag by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The tag ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_update_tag',
    description: 'Update an existing WordPress tag.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The tag ID to update',
        },
        name: {
          type: 'string',
          description: 'The tag name',
        },
        description: {
          type: 'string',
          description: 'The tag description',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_tag',
    description: 'Delete a WordPress tag by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The tag ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_get_comment',
    description: 'Get a specific WordPress comment by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The comment ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_update_comment',
    description: 'Update an existing WordPress comment.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The comment ID to update',
        },
        content: {
          type: 'string',
          description: 'The comment content',
        },
        status: {
          type: 'string',
          description: 'Comment status',
          enum: ['approved', 'hold', 'spam', 'trash'],
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_comment',
    description: 'Delete a WordPress comment by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The comment ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_get_user',
    description: 'Get a specific WordPress user by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The user ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_create_user',
    description: 'Create a new WordPress user.',
    input_schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'Login name for the user',
        },
        email: {
          type: 'string',
          description: 'Email address for the user',
        },
        password: {
          type: 'string',
          description: 'Password for the user (never included in response)',
        },
        name: {
          type: 'string',
          description: 'Display name for the user',
        },
        first_name: {
          type: 'string',
          description: 'First name for the user',
        },
        last_name: {
          type: 'string',
          description: 'Last name for the user',
        },
        roles: {
          type: 'array',
          description: 'Roles assigned to the user',
          items: { type: 'string' },
        },
      },
      required: ['username', 'email', 'password'],
    },
  },
  {
    name: 'wp_update_user',
    description: 'Update an existing WordPress user.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The user ID to update',
        },
        username: {
          type: 'string',
          description: 'Login name for the user',
        },
        email: {
          type: 'string',
          description: 'Email address for the user',
        },
        password: {
          type: 'string',
          description: 'Password for the user',
        },
        name: {
          type: 'string',
          description: 'Display name for the user',
        },
        first_name: {
          type: 'string',
          description: 'First name for the user',
        },
        last_name: {
          type: 'string',
          description: 'Last name for the user',
        },
        roles: {
          type: 'array',
          description: 'Roles assigned to the user',
          items: { type: 'string' },
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_user',
    description: 'Delete a WordPress user by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The user ID to delete',
        },
        reassign: {
          type: 'number',
          description: 'Reassign the deleted user\'s posts and links to this user ID',
        },
        force: {
          type: 'boolean',
          description: 'Required to be true, as users do not support trashing',
        },
      },
      required: ['id', 'force'],
    },
  },
  {
    name: 'wp_update_media',
    description: 'Update an existing WordPress media item.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The media ID to update',
        },
        title: {
          type: 'string',
          description: 'The title for the media item',
        },
        alt_text: {
          type: 'string',
          description: 'Alternative text for the media item',
        },
        caption: {
          type: 'string',
          description: 'Caption for the media item',
        },
        description: {
          type: 'string',
          description: 'Description for the media item',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_media',
    description: 'Delete a WordPress media item by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The media ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_get_settings',
    description: 'Get WordPress site settings.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'wp_update_settings',
    description: 'Update WordPress site settings.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Site title',
        },
        description: {
          type: 'string',
          description: 'Site tagline',
        },
        url: {
          type: 'string',
          description: 'Site URL',
        },
        email: {
          type: 'string',
          description: 'Site admin email address',
        },
        timezone: {
          type: 'string',
          description: 'Timezone string',
        },
        date_format: {
          type: 'string',
          description: 'Date format',
        },
        time_format: {
          type: 'string',
          description: 'Time format',
        },
        start_of_week: {
          type: 'number',
          description: 'Start of week (0=Sunday, 1=Monday, etc.)',
        },
        language: {
          type: 'string',
          description: 'Site language code',
        },
        use_smilies: {
          type: 'boolean',
          description: 'Convert emoticons to graphics on display',
        },
        default_category: {
          type: 'number',
          description: 'Default post category',
        },
        default_post_format: {
          type: 'string',
          description: 'Default post format',
        },
        posts_per_page: {
          type: 'number',
          description: 'Blog pages show at most',
        },
      },
    },
  },
  {
    name: 'wp_search',
    description: 'Search WordPress content across posts, pages, and other post types.',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search keyword(s)',
        },
        per_page: {
          type: 'number',
          description: 'Number of results per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        type: {
          type: 'string',
          description: 'Limit results to a specific type',
          enum: ['post', 'page', 'post-format', 'category', 'tag'],
        },
        subtype: {
          type: 'string',
          description: 'Limit results to posts of a specific post type',
        },
      },
      required: ['search'],
    },
  },
  {
    name: 'wp_list_taxonomies',
    description: 'List all registered WordPress taxonomies.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Limit results to taxonomies associated with a specific post type',
        },
      },
    },
  },
  {
    name: 'wp_get_taxonomy',
    description: 'Get a specific WordPress taxonomy by slug.',
    input_schema: {
      type: 'object',
      properties: {
        taxonomy: {
          type: 'string',
          description: 'The taxonomy slug (e.g., "category", "post_tag")',
        },
      },
      required: ['taxonomy'],
    },
  },
  {
    name: 'wp_list_plugins',
    description: 'List all WordPress plugins.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by plugin status',
          enum: ['active', 'inactive'],
        },
        search: {
          type: 'string',
          description: 'Search plugins by keyword',
        },
      },
    },
  },
  {
    name: 'wp_get_plugin',
    description: 'Get a specific WordPress plugin by slug.',
    input_schema: {
      type: 'object',
      properties: {
        plugin: {
          type: 'string',
          description: 'The plugin slug (e.g., "akismet/akismet")',
        },
      },
      required: ['plugin'],
    },
  },
  {
    name: 'wp_create_plugin',
    description: 'Install a new WordPress plugin from the WordPress.org repository.',
    input_schema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The plugin slug from WordPress.org',
        },
        status: {
          type: 'string',
          description: 'The plugin status after installation',
          enum: ['active', 'inactive'],
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'wp_update_plugin',
    description: 'Update a WordPress plugin (activate/deactivate).',
    input_schema: {
      type: 'object',
      properties: {
        plugin: {
          type: 'string',
          description: 'The plugin slug (e.g., "akismet/akismet")',
        },
        status: {
          type: 'string',
          description: 'The plugin status',
          enum: ['active', 'inactive'],
        },
      },
      required: ['plugin', 'status'],
    },
  },
  {
    name: 'wp_delete_plugin',
    description: 'Delete/uninstall a WordPress plugin completely from the site. Use this tool when you need to remove a plugin entirely from WordPress. The plugin must be inactive before deletion. This permanently removes the plugin files from the server.',
    input_schema: {
      type: 'object',
      properties: {
        plugin: {
          type: 'string',
          description: 'The plugin slug in the format "folder/file.php" (e.g., "akismet/akismet.php", "hello-dolly/hello.php"). This is the unique identifier for the plugin.',
        },
      },
      required: ['plugin'],
    },
  },
];
