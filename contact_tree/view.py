from django.shortcuts import render
from django.http import Http404
# from django.core.cache import cache 

def index(request):
    # if request.GET.get('species'):
    #     driver = request.GET['driver']
    # else:
    #     raise Http404
    # print "in show: %s" % driver
    # cache.clear()
    return render(request, 'index.html', {}) 