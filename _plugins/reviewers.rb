module Jekyll
	class ReviewersTag < Liquid::Tag
		def render(context)
			reviewers = context.registers[:page]["reviewers"]
			if reviewers
				output = "**Merci** aux relecteurs: " + reviewers.map { |reviewer| "[*#{reviewer['name']}*](#{reviewer['link']})" }.join(", ")
				output
			else
				""
			end
		end
	end
end

Liquid::Template.register_tag("reviewers", Jekyll::ReviewersTag)
