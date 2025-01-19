---
layout: page
title: Blog
permalink: /blog
order: 1
background: mountains2.jpg
---

<div class="container">

	<h2 class="text-center"><span class="rounded-card">Notes</span></h2>

	{% assign date_format = site.minima.date_format | default: "%b %-d, %Y" %}

	<section class="article-cards">
		{% for post in site.posts %}
			<a href="{{ post.url | relative_url }}" class="card">
				<header{% if post.background != "" %} style="--background-image: url('/assets/images/backgrounds/{{ post.background }}');"{% endif %}>
					<h2>{{ post.title }}</h2>
				</header>
				<div>
					{{ post.excerpt }}
					{{ post.date | date: date_format }}
				</div>
			</a>
		{% endfor %}
	</section>

</div>
