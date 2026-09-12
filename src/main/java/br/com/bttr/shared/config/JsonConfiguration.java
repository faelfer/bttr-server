package br.com.bttr.shared.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.jackson.ObjectMapperCustomizer;
import jakarta.inject.Singleton;

@Singleton
public class JsonConfiguration implements ObjectMapperCustomizer {
    @Override
    public void customize(ObjectMapper mapper) {
        // Preserve numeric strings from HTML inputs, but never silently truncate fractions.
        mapper.disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);
    }
}
