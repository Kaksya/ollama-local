from django.contrib import admin

from .models import KnowledgeDocument, Post

admin.site.register(Post)
admin.site.register(KnowledgeDocument)
