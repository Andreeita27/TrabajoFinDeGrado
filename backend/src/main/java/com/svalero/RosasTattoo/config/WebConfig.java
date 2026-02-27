package com.svalero.RosasTattoo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.upload.public-base:/uploads}")
    private String publicBase;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /uploads/** -> C:/62rosas_uploads/public/
        registry.addResourceHandler(publicBase + "/**")
                .addResourceLocations("file:" + uploadDir + "/public/");
    }
}
