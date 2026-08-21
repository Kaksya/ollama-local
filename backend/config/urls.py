from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from blog.views import ChatView, KnowledgeDocumentViewSet, PostViewSet

router = DefaultRouter()
router.register("posts", PostViewSet, basename="post")
router.register("knowledge", KnowledgeDocumentViewSet, basename="knowledge")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/chat/", ChatView.as_view(), name="chat"),
    path("api/", include(router.urls)),
]
