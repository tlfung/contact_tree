from django.conf.urls import patterns, include, url
import view
import query

from contact_tree import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = patterns('',
    (r'^$', view.index),
    (r'^get_update/$', query.one_contact_update),
    (r'^dataset/$', query.get_dataset),
    (r'^datatable/$', query.get_list_ego),
    (r'^upload_csv/$', query.upload_file),
    (r'^collecting_data/$', query.create_csv2database),
    (r'^update_binary/$', query.update_binary),
    (r'^update_layer/$', query.update_layer),
    (r'^fetch_data/$', query.fetch_data),
    (r'^restore_data/$', query.restore_mapping_update),
    (r'^last_use_data/$', query.last_use_update),
    (r'^dataset_mode/$', query.get_dataset_mode),
    (r'^auto_save/$', query.auto_save),
    (r'^save_mapping/$', query.save_mapping),
    (r'^get_user_data/$', query.get_user_data),
    (r'^update_highlight/$', query.update_highlight),
    (r'^restore_user_mapping/$', query.restore_user_mapping),
    (r'^restore_user_history/$', query.restore_user_history),
    (r'^restore_user_group_history/$', query.restore_user_group_history),
    (r'^del_mapping/$', query.del_mapping)
)

urlpatterns += staticfiles_urlpatterns()

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_PATH}),
    ) 

