package br.com.bttr.shared.pagination;

import java.util.List;
import java.util.function.Function;

public record PageResult<T>(long count, List<T> results) {
  public <R> PageResult<R> map(Function<T, R> mapper) {
    return new PageResult<>(count, results.stream().map(mapper).toList());
  }
}
