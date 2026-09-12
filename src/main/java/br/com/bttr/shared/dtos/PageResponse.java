package br.com.bttr.shared.dtos;

import java.util.List;

public record PageResponse<T>(long count, String next, String previous, List<T> results) {}
