from django.conf.urls import patterns, include, url
import view
import query

from contact_tree import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = patterns('',
    (r'^$', view.index),
    (r'^get_contact/$', query.one_contact),
    (r'^get_update/$', query.one_contact_update),
    (r'^update_contact/$', query.update_contact),
    (r'^dblp_list/$', query.list_author),
    (r'^one_author/$', query.one_author),
    (r'^dataset/$', query.get_dataset),
    (r'^datatable/$', query.get_list_ego),
    (r'^datainfo/$', query.get_data_info),
    (r'^one_country/$', query.get_country),
    (r'^update_author/$', query.upadte_author),
    (r'^upload_csv/$', query.upload_file),
    (r'^update_collection/$', query.update_collection_data),
    (r'^collecting_data/$', query.create_csv2database),
    (r'^update_binary/$', query.update_binary),
    (r'^update_layer/$', query.update_layer),
    (r'^update_structure/$', query.restructure),
    (r'^fetch_data/$', query.fetch_data)
    # (r'^set_attr/$', query.change_attr)
    # (r'^testing/$', query.test)
)

urlpatterns += staticfiles_urlpatterns()

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_PATH}),
    ) 

