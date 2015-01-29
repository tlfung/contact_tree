from django.conf.urls import patterns, include, url
import view
import query

from contact_tree import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = patterns('',
    (r'^$', view.index),
    (r'^one_contact/$', query.one_contact),
    (r'^update_contact/$', query.update_contact),
    (r'^dblp_list/$', query.list_author),
    (r'^one_author/$', query.one_author),
    (r'^dataset/$', query.get_dataset),
    (r'^datafolder/$', query.get_list_ego),
    (r'^datainfo/$', query.get_data_info),
    (r'^one_country/$', query.get_country),
    (r'^update_author/$', query.upadte_author),
    (r'^upload_csv/$', query.upload_view),
    (r'^data_collection/$', query.create_csv2database)
    # (r'^set_attr/$', query.change_attr)
    # (r'^testing/$', query.test)
)

urlpatterns += staticfiles_urlpatterns()

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_PATH}),
    ) 

