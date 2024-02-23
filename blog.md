---
layout: page
title: Blog
permalink: /blog
order: 1
background: mountains2.jpg
---

<div class="container">

	{% for post in site.posts %}
		<h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
		<p>{{ post.excerpt }}</p>
	{% endfor %}

	<hr>

	{% if site.paginate %}
		{% assign posts = paginator.posts %}
	{% else %}
		{% assign posts = site.posts %}
	{% endif %}

	{% if posts.size > 0 %}

		{% if page.list_title %}
			<h2>{{ page.list_title }}</h2>
		{% endif %}
		<ul>
			{% assign date_format = site.minima.date_format | default: "%b %-d, %Y" %}
			{% for post in posts %}
				<li>
					{{ post.date | date: date_format }}
					<h3>
						<a href="{{ post.url | relative_url }}" class="underline-hover underlined">{{ post.title | escape }}</a>
					</h3>
					{% if site.show_excerpts %}
						{{ post.excerpt }}
					{% endif %}
				</li>
			{% endfor %}
		</ul>

		{% if site.paginate %}
			<ul class="pagination">
				{% if paginator.previous_page %}
					<li><a href="{{ paginator.previous_page_path | relative_url }}">{{ paginator.previous_page }}</a></li>
				{% else %}
					<li>•</li>
				{% endif %}
					<li>{{ paginator.page }}</li>
				{% if paginator.next_page %}
					<li><a href="{{ paginator.next_page_path | relative_url }}">{{ paginator.next_page }}</a></li>
				{% else %}
					<li>•</li>
				{% endif %}
			</ul>
		{% endif %}

	{% endif %}
</div>
